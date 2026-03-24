import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function DataSync({ userId, onSyncComplete, onClose }) {
  const [syncing,  setSyncing]  = useState(false);
  const [status,   setStatus]   = useState('');
  const [sCls,     setSCls]     = useState('info');
  const [syncType, setSyncType] = useState('all');
  const [progress, setProgress] = useState(0);
  const [history,  setHistory]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('sync_history') || '[]'); } catch { return []; }
  });

  const syncManholes = async () => {
    setStatus('Uploading manhole changes…'); setProgress(25);
    const pending = JSON.parse(localStorage.getItem('pending_manholes') || '[]');
    for (let i = 0; i < pending.length; i++) {
      const { error } = await supabase.from('waste_water_manhole').upsert([pending[i]], { onConflict: 'gid' });
      if (error) throw new Error(error.message);
      setProgress(25 + Math.round((i / pending.length) * 20));
    }
    localStorage.setItem('pending_manholes', '[]');
    return pending.length;
  };

  const syncPipelines = async () => {
    setStatus('Uploading pipeline changes…'); setProgress(50);
    const pending = JSON.parse(localStorage.getItem('pending_pipelines') || '[]');
    for (let i = 0; i < pending.length; i++) {
      const { error } = await supabase.from('waste_water_pipeline').upsert([pending[i]], { onConflict: 'gid' });
      if (error) throw new Error(error.message);
      setProgress(50 + Math.round((i / pending.length) * 20));
    }
    localStorage.setItem('pending_pipelines', '[]');
    return pending.length;
  };

  const pullRemote = async () => {
    setStatus('Downloading remote data…'); setProgress(75);
    const { data: m, error: me } = await supabase.from('waste_water_manhole').select('*').order('updated_at', { ascending: false });
    if (me) throw new Error(me.message);
    const { data: p, error: pe } = await supabase.from('waste_water_pipeline').select('*').order('updated_at', { ascending: false });
    if (pe) throw new Error(pe.message);
    localStorage.setItem('offline_manholes', JSON.stringify(m));
    localStorage.setItem('offline_pipelines', JSON.stringify(p));
    localStorage.setItem('last_sync_time', new Date().toISOString());
    setProgress(100);
    return { m: m.length, p: p.length };
  };

  const handleSync = async () => {
    setSyncing(true); setStatus('Starting sync…'); setSCls('info'); setProgress(0);
    try {
      const res = { mh: 0, pl: 0, remote: false };
      if (syncType === 'all' || syncType === 'manholes')  res.mh = await syncManholes();
      if (syncType === 'all' || syncType === 'pipelines') res.pl = await syncPipelines();
      if (syncType === 'all' || syncType === 'download')  { await pullRemote(); res.remote = true; }

      const rec = { timestamp: new Date().toISOString(), type: syncType, res, userId };
      const h   = [rec, ...history].slice(0, 10);
      setHistory(h);
      localStorage.setItem('sync_history', JSON.stringify(h));

      setStatus(`Sync complete — ${res.mh} manholes, ${res.pl} pipelines pushed.`);
      setSCls('ok');
      onSyncComplete?.();
    } catch (err) {
      setStatus(`Sync failed: ${err.message}`); setSCls('err');
    } finally {
      setSyncing(false);
    }
  };

  const forceResync = async () => {
    if (!confirm('Discard all local changes and pull fresh data?')) return;
    setSyncing(true); setStatus('Clearing cache…'); setSCls('info'); setProgress(10);
    try {
      localStorage.removeItem('pending_manholes');
      localStorage.removeItem('pending_pipelines');
      setProgress(20);
      const { data: m, error: me } = await supabase.from('waste_water_manhole').select('*');
      if (me) throw new Error(me.message);
      setProgress(60);
      const { data: p, error: pe } = await supabase.from('waste_water_pipeline').select('*');
      if (pe) throw new Error(pe.message);
      localStorage.setItem('offline_manholes', JSON.stringify(m));
      localStorage.setItem('offline_pipelines', JSON.stringify(p));
      localStorage.setItem('last_sync_time', new Date().toISOString());
      setProgress(100);
      setStatus(`Full resync — ${m.length} manholes, ${p.length} pipelines.`);
      setSCls('ok');
      onSyncComplete?.();
    } catch (err) {
      setStatus(`Resync failed: ${err.message}`); setSCls('err');
    } finally {
      setSyncing(false);
    }
  };

  const lastSync = () => { const t = localStorage.getItem('last_sync_time'); return t ? new Date(t).toLocaleString() : 'Never'; };
  const pending  = () => {
    const m = JSON.parse(localStorage.getItem('pending_manholes') || '[]').length;
    const p = JSON.parse(localStorage.getItem('pending_pipelines') || '[]').length;
    return m + p;
  };
  const pend = pending();

  const modes = [
    { id: 'all',       icon: '🔄', lbl: 'Full Sync'     },
    { id: 'manholes',  icon: '🕳️', lbl: 'Manholes'      },
    { id: 'pipelines', icon: '📏', lbl: 'Pipelines'     },
    { id: 'download',  icon: '⬇',  lbl: 'Download Only' },
  ];

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(34,211,238,0.08)', '--panel-icon-border': 'rgba(34,211,238,0.25)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">🔄</div>
        <div>
          <div className="wd-panel-title">Data Sync</div>
          <div className="wd-panel-sub">Push local · Pull remote · Force resync</div>
        </div>
        <button className="wd-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="wd-panel-body">
        {/* Status overview */}
        <div className="wd-stats" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <div className={`wd-stat ${pend > 0 ? 'amber' : 'green'}`}>
            <div className="s-num">{pend}</div>
            <div className="s-lbl">Pending</div>
          </div>
          <div className="wd-stat lime">
            <div className="s-num" style={{ fontSize: 13 }}>{lastSync().split(',')[0]}</div>
            <div className="s-lbl">Last Sync</div>
          </div>
        </div>

        {/* Session info */}
        <div style={{ padding: '10px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)', marginBottom: 14 }}>
          <div className="wd-info-row"><span className="ir-k">User ID</span><span className="ir-v" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>{userId?.slice(0,14)}…</span></div>
          <div className="wd-info-row"><span className="ir-k">Connection</span><span className="ir-v" style={{ color: 'var(--accent-primary)' }}>● Online</span></div>
        </div>

        {/* Sync mode */}
        <div className="wd-section">Sync Mode</div>
        <div className="wd-mode-grid">
          {modes.map(m => (
            <div key={m.id} className={`wd-mode-tile${syncType===m.id?' active':''}`} onClick={() => !syncing && setSyncType(m.id)}>
              <span>{m.icon}</span> {m.lbl}
            </div>
          ))}
        </div>

        {/* Progress */}
        {syncing && (
          <>
            <div className="wd-progress-track"><div className="wd-progress-fill" style={{ width: `${progress}%` }} /></div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-sec)', marginBottom: 8 }}>{progress}%</div>
          </>
        )}

        {status && <div className={`wd-status ${sCls}`}>{status}</div>}

        <div className="wd-btn-row">
          <button className="wd-btn wd-btn-primary" style={{ flex: 2 }} onClick={handleSync} disabled={syncing}>
            {syncing ? `⏳ ${progress}%…` : '🔄 Start Sync'}
          </button>
          <button className="wd-btn wd-btn-amber" onClick={forceResync} disabled={syncing}>Force</button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <>
            <div className="wd-section" style={{ marginTop: 20 }}>Recent Syncs</div>
            {history.slice(0, 5).map((item, i) => (
              <div key={i} className="wd-history">
                <div className="h-time">{new Date(item.timestamp).toLocaleString()}</div>
                <div className="h-detail">{item.type} · {item.res.mh} manholes · {item.res.pl} pipelines{item.res.remote ? ' · pulled' : ''}</div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}