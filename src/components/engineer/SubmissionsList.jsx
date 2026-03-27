import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const STATUS_ORDER = ['pending', 'approved', 'cleaned', 'rejected'];

export default function SubmissionsList({ onClose, onRefresh }) {
  const [submissions,    setSubmissions]    = useState([]);
  const [forms,          setForms]          = useState([]);
  const [selectedFormId, setSelectedFormId] = useState('');
  const [filterStatus,   setFilterStatus]   = useState('all');
  const [loading,        setLoading]        = useState(true);
  const [updating,       setUpdating]       = useState(null);
  const [expanded,       setExpanded]       = useState(null);

  useEffect(() => { fetchForms(); }, []);
  useEffect(() => { fetchSubmissions(); }, [selectedFormId, filterStatus]);

  const fetchForms = async () => {
    const { data } = await supabase.from('forms').select('id, title').order('created_at', { ascending: false });
    setForms(data || []);
  };

  const fetchSubmissions = async () => {
    setLoading(true);
    let q = supabase
      .from('form_submissions')
      .select('id, form_id, collector_id, data, location, submitted_at, status, cleaned_data, engineer_notes')
      .order('submitted_at', { ascending: false });
    if (selectedFormId)            q = q.eq('form_id', selectedFormId);
    if (filterStatus !== 'all')    q = q.eq('status', filterStatus);

    const { data, error } = await q;
    if (!error) setSubmissions(data || []);
    setLoading(false);
  };

  const updateStatus = async (id, newStatus) => {
    setUpdating(id);
    const { error } = await supabase
      .from('form_submissions')
      .update({ status: newStatus })
      .eq('id', id);
    if (!error) { onRefresh?.(); fetchSubmissions(); }
    else alert('Error: ' + error.message);
    setUpdating(null);
  };

  const formTitle = (fid) => forms.find(f => f.id === fid)?.title || 'Unknown form';

  const counts = {
    all:      submissions.length,
    pending:  submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
    cleaned:  submissions.filter(s => s.status === 'cleaned').length,
  };

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(245,158,11,0.08)', '--panel-icon-border': 'rgba(245,158,11,0.25)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">📋</div>
        <div>
          <div className="wd-panel-title">Submissions</div>
          <div className="wd-panel-sub">
            {counts.pending > 0 ? `${counts.pending} pending review` : 'Review collector submissions'}
          </div>
        </div>
        <button className="wd-panel-close" onClick={onClose}>×</button>
      </div>

      {/* Stats row */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(10,31,10,0.4)', display: 'flex', gap: 6 }}>
        {[
          { lbl: 'Total',    val: counts.all,      cls: 'sky'   },
          { lbl: 'Pending',  val: counts.pending,  cls: counts.pending > 0 ? 'amber' : 'green' },
          { lbl: 'Approved', val: counts.approved, cls: 'green' },
          { lbl: 'Rejected', val: counts.rejected, cls: counts.rejected > 0 ? 'red' : '' },
        ].map(s => (
          <div key={s.lbl} className={`wd-stat ${s.cls}`} style={{ flex: 1 }}>
            <div className="s-num" style={{ fontSize: 18 }}>{s.val}</div>
            <div className="s-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="wd-tabs">
        {['all', 'pending', 'approved', 'rejected'].map(s => (
          <button key={s} className={`wd-tab${filterStatus === s ? ' active' : ''}`}
            onClick={() => setFilterStatus(s)}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
            {counts[s] > 0 && <span style={{ marginLeft: 4, fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.8 }}>({counts[s]})</span>}
          </button>
        ))}
      </div>

      {/* Form filter */}
      <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)' }}>
        <select className="wd-select" value={selectedFormId} onChange={e => setSelectedFormId(e.target.value)}>
          <option value="">All Forms</option>
          {forms.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
        </select>
      </div>

      <div className="wd-panel-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-sec)' }}>
            ⟳ Loading submissions…
          </div>
        ) : submissions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-sec)' }}>No submissions</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 4 }}>No results for current filters</div>
          </div>
        ) : (
          submissions.map(sub => {
            const isOpen = expanded === sub.id;
            return (
              <div
                key={sub.id}
                className={`wd-sub-item${sub.status !== 'pending' ? ` ${sub.status}` : ''}`}
              >
                {/* Header row */}
                <div className="si-top">
                  <div className="si-form-name">{formTitle(sub.form_id)}</div>
                  <span className={`wd-sub-badge ${sub.status}`}>{sub.status}</span>
                </div>

                {/* Meta */}
                <div className="si-meta">
                  <span className="si-meta-item">🕐 {new Date(sub.submitted_at).toLocaleString()}</span>
                  <span className="si-meta-item">👤 {sub.collector_id?.slice(0,8)}…</span>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpanded(isOpen ? null : sub.id)}
                  style={{
                    background: 'none', border: 'none',
                    fontFamily: 'var(--font-mono)', fontSize: 10,
                    color: 'var(--text-sec)', cursor: 'pointer',
                    padding: '4px 0', marginBottom: isOpen ? 8 : 0,
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}
                >
                  {isOpen ? '▲ Hide data' : '▼ Show data'}
                </button>

                {/* Expanded data */}
                {isOpen && (
                  <>
                    <div className="si-data-preview">
                      {JSON.stringify(sub.data, null, 2)}
                    </div>
                    {sub.cleaned_data && (
                      <>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent-sky)', marginBottom: 4 }}>
                          Cleaned Data
                        </div>
                        <div className="si-data-preview" style={{ borderColor: 'rgba(34,211,238,0.2)' }}>
                          {JSON.stringify(sub.cleaned_data, null, 2)}
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Actions */}
                {sub.status === 'pending' && (
                  <div className="wd-sub-actions">
                    <button
                      className="wd-btn wd-btn-primary"
                      onClick={() => updateStatus(sub.id, 'approved')}
                      disabled={updating === sub.id}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="wd-btn wd-btn-danger"
                      onClick={() => updateStatus(sub.id, 'rejected')}
                      disabled={updating === sub.id}
                    >
                      ✗ Reject
                    </button>
                  </div>
                )}

                {sub.status === 'approved' && (
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-primary)', marginTop: 4 }}>
                    ✓ Approved · data pushed to network
                  </div>
                )}

                {sub.status === 'rejected' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-red)' }}>✗ Rejected</span>
                    <button
                      className="wd-btn wd-btn-ghost"
                      style={{ padding: '3px 10px', fontSize: 10 }}
                      onClick={() => updateStatus(sub.id, 'pending')}
                      disabled={updating === sub.id}
                    >
                      ↩ Reopen
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}