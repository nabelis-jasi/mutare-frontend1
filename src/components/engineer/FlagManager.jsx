// src/components/engineer/FlagManager.jsx
import React, { useState, useEffect } from 'react';
import api from "../../api/api"; // adjust path to your api.js

export default function FlagManager({ onFlagManaged, onClose }) {
  const [flags,    setFlags]   = useState([]);
  const [loading,  setLoading] = useState(true);
  const [selected, setSelected]= useState(null);
  const [action,   setAction]  = useState('resolve');
  const [note,     setNote]    = useState('');
  const [filter,   setFilter]  = useState('all');
  const [stats,    setStats]   = useState({ total: 0, resolved: 0, pending: 0 });
  const [working,  setWorking] = useState(false);

  useEffect(() => { fetchFlags(); }, [filter]);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      let manholes = [], pipelines = [];
      if (filter !== 'pipelines') {
        const res = await api.get('/manholes?flagged=true');
        manholes = (res.data || []).map(m => ({ ...m, feature_type: 'manhole' }));
      }
      if (filter !== 'manholes') {
        const res = await api.get('/pipelines?flagged=true');
        pipelines = (res.data || []).map(p => ({ ...p, feature_type: 'pipeline' }));
      }
      const all = [...manholes, ...pipelines];
      setFlags(all);
      const resolved = all.filter(f => f.flag_resolved).length;
      setStats({ total: all.length, resolved, pending: all.length - resolved });
    } catch (err) {
      console.error('Error fetching flags:', err);
    } finally {
      setLoading(false);
    }
  };

  const resolveFlag = async () => {
    if (!selected) return;
    setWorking(true);
    try {
      const endpoint = selected.feature_type === 'manhole' ? `/manholes/${selected.id}` : `/pipelines/${selected.id}`;
      await api.put(endpoint, {
        flagged: false,
        flag_resolved: true,
        flag_resolved_at: new Date().toISOString(),
        flag_resolution_note: note,
        flag_resolved_by: localStorage.getItem('user_id')
      });
      setSelected(null);
      setNote('');
      await fetchFlags();
      if (onFlagManaged) onFlagManaged();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setWorking(false);
    }
  };

  const deleteFlag = async () => {
    if (!selected || !confirm(`Permanently delete this ${selected.feature_type}?`)) return;
    setWorking(true);
    try {
      const endpoint = selected.feature_type === 'manhole' ? `/manholes/${selected.id}` : `/pipelines/${selected.id}`;
      await api.delete(endpoint);
      setSelected(null);
      await fetchFlags();
      if (onFlagManaged) onFlagManaged();
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setWorking(false);
    }
  };

  const sevBadge = (f) => {
    if (f.flag_resolved) return { cls: 'wd-badge wd-badge-ok',     lbl: 'Resolved' };
    if (f.flag_severity === 'high')   return { cls: 'wd-badge wd-badge-high',   lbl: 'High'   };
    if (f.flag_severity === 'medium') return { cls: 'wd-badge wd-badge-medium', lbl: 'Medium' };
    return { cls: 'wd-badge wd-badge-low', lbl: 'Low' };
  };

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(245,158,11,0.08)', '--panel-icon-border': 'rgba(245,158,11,0.25)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">🚩</div>
        <div>
          <div className="wd-panel-title">Flag Manager</div>
          <div className="wd-panel-sub">{stats.pending} pending · {stats.resolved} resolved</div>
        </div>
        <button className="wd-panel-close" onClick={onClose}>×</button>
      </div>

      {/* Stats */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', background: 'rgba(10,31,10,0.4)', display: 'flex', gap: 8 }}>
        {[
          { lbl: 'Total',    val: stats.total,    cls: 'sky'   },
          { lbl: 'Pending',  val: stats.pending,  cls: stats.pending > 0 ? 'amber' : 'green' },
          { lbl: 'Resolved', val: stats.resolved, cls: 'green' },
        ].map(s => (
          <div key={s.lbl} className={`wd-stat ${s.cls}`} style={{ flex: 1 }}>
            <div className="s-num">{s.val}</div>
            <div className="s-lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="wd-tabs">
        {[['all','All'],['manholes','🕳️ Manholes'],['pipelines','📏 Pipelines']].map(([id, lbl]) => (
          <button key={id} className={`wd-tab${filter===id?' active':''}`} onClick={() => setFilter(id)}>{lbl}</button>
        ))}
      </div>

      {/* List */}
      <div className="wd-panel-body">
        {loading ? (
          <div style={{ textAlign: 'center', padding: 32, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-sec)' }}>⟳ Loading flags…</div>
        ) : flags.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 32 }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🎉</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--accent-primary)' }}>No flags found</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-sec)', marginTop: 4 }}>All clear for current filter</div>
          </div>
        ) : (
          flags.map(f => {
            const { cls, lbl } = sevBadge(f);
            return (
              <div
                key={`${f.feature_type}-${f.id}`}
                className={`wd-flag-card${selected?.id === f.id ? ' selected' : ''}${f.flag_resolved ? ' resolved' : ''}`}
                onClick={() => setSelected(f)}
              >
                <div className="fc-top">
                  <span className="fc-type">{f.feature_type === 'manhole' ? '🕳️ Manhole' : '📏 Pipeline'}</span>
                  <span className={cls}>{lbl}</span>
                </div>
                <div className="fc-id">ID: {f.manhole_id || f.pipe_id || f.id}</div>
                <div className="fc-reason">🚩 {f.flag_reason || 'No reason provided'}</div>
                <div className="fc-date">
                  {f.flagged_at ? new Date(f.flagged_at).toLocaleString() : 'Unknown date'}
                  {f.flag_resolved && ` · ✓ ${f.flag_resolution_note || 'Resolved'}`}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Action panel */}
      {selected && !selected.flag_resolved && (
        <div className="wd-panel-footer">
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 10 }}>
            Actions — {selected.feature_type} · {selected.manhole_id || selected.pipe_id || selected.id}
          </div>

          <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
            {['resolve', 'delete'].map(a => (
              <button key={a}
                className={`wd-btn ${a === 'resolve' ? 'wd-btn-primary' : 'wd-btn-ghost'}`}
                style={{ flex: 1, color: action === a && a === 'delete' ? 'var(--accent-red)' : undefined,
                         borderColor: action === a && a === 'delete' ? 'var(--accent-red)' : undefined }}
                onClick={() => setAction(a)}
              >
                {a === 'resolve' ? '✓ Resolve' : '🗑 Delete'}
              </button>
            ))}
          </div>

          {action === 'resolve' && (
            <>
              <label className="wd-label">Resolution Note</label>
              <textarea className="wd-textarea" rows={2} placeholder="How was this resolved…" value={note} onChange={e => setNote(e.target.value)} />
              <div className="wd-btn-row">
                <button className="wd-btn wd-btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
                <button className="wd-btn wd-btn-primary" onClick={resolveFlag} disabled={working}>
                  {working ? '⏳' : '✓ Confirm Resolution'}
                </button>
              </div>
            </>
          )}

          {action === 'delete' && (
            <div className="wd-btn-row">
              <button className="wd-btn wd-btn-ghost"   onClick={() => setSelected(null)}>Cancel</button>
              <button className="wd-btn wd-btn-danger"  onClick={deleteFlag} disabled={working}>
                {working ? '⏳' : '🗑 Permanently Delete'}
              </button>
            </div>
          )}
        </div>
      )}

      {selected && selected.flag_resolved && (
        <div className="wd-panel-footer">
          <div style={{ textAlign: 'center', padding: 10, background: 'rgba(74,173,74,0.06)', border: '1px solid rgba(74,173,74,0.2)', borderRadius: 'var(--r-md)', color: 'var(--accent-primary)', fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 700 }}>
            ✓ Flag has been resolved
            {selected.flag_resolution_note && <p style={{ color: 'var(--text-sec)', fontSize: 11, fontFamily: 'var(--font-mono)', marginTop: 4, fontWeight: 400 }}>{selected.flag_resolution_note}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
