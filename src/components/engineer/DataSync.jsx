import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function DataSync({ userId, onSyncComplete, onClose }) {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [syncType, setSyncType] = useState('all');
  const [progress, setProgress] = useState(0);
  const [syncHistory, setSyncHistory] = useState(() => {
    try { return JSON.parse(localStorage.getItem('sync_history') || '[]'); } catch { return []; }
  });

  const syncManholes = async () => {
    setStatus('Uploading pending manhole changes…');
    setProgress(25);
    const pending = JSON.parse(localStorage.getItem('pending_manholes') || '[]');
    for (let i = 0; i < pending.length; i++) {
      const { error } = await supabase.from('waste_water_manhole').upsert([pending[i]], { onConflict: 'gid' });
      if (error) throw new Error(`Manhole sync failed: ${error.message}`);
      setProgress(25 + Math.round((i / pending.length) * 20));
    }
    localStorage.setItem('pending_manholes', '[]');
    return pending.length;
  };

  const syncPipelines = async () => {
    setStatus('Uploading pending pipeline changes…');
    setProgress(50);
    const pending = JSON.parse(localStorage.getItem('pending_pipelines') || '[]');
    for (let i = 0; i < pending.length; i++) {
      const { error } = await supabase.from('waste_water_pipeline').upsert([pending[i]], { onConflict: 'gid' });
      if (error) throw new Error(`Pipeline sync failed: ${error.message}`);
      setProgress(50 + Math.round((i / pending.length) * 20));
    }
    localStorage.setItem('pending_pipelines', '[]');
    return pending.length;
  };

  const syncRemoteToLocal = async () => {
    setStatus('Downloading latest remote data…');
    setProgress(75);
    const { data: manholes, error: me } = await supabase.from('waste_water_manhole').select('*').order('updated_at', { ascending: false });
    if (me) throw new Error(me.message);
    const { data: pipelines, error: pe } = await supabase.from('waste_water_pipeline').select('*').order('updated_at', { ascending: false });
    if (pe) throw new Error(pe.message);
    localStorage.setItem('offline_manholes', JSON.stringify(manholes));
    localStorage.setItem('offline_pipelines', JSON.stringify(pipelines));
    localStorage.setItem('last_sync_time', new Date().toISOString());
    setProgress(100);
    return { manholes: manholes.length, pipelines: pipelines.length };
  };

  const handleSync = async () => {
    setSyncing(true);
    setStatus('Initialising sync…');
    setStatusType('info');
    setProgress(0);
    try {
      const results = { manholesSynced: 0, pipelinesSynced: 0, remoteSynced: false };
      if (syncType === 'all' || syncType === 'manholes')   results.manholesSynced  = await syncManholes();
      if (syncType === 'all' || syncType === 'pipelines')  results.pipelinesSynced = await syncPipelines();
      if (syncType === 'all' || syncType === 'download')   { await syncRemoteToLocal(); results.remoteSynced = true; }

      const record = { timestamp: new Date().toISOString(), type: syncType, results, userId };
      const newHistory = [record, ...syncHistory].slice(0, 10);
      setSyncHistory(newHistory);
      localStorage.setItem('sync_history', JSON.stringify(newHistory));

      setStatus(`Sync complete — ${results.manholesSynced} manholes, ${results.pipelinesSynced} pipelines pushed.`);
      setStatusType('ok');
      onSyncComplete?.();
    } catch (err) {
      setStatus(`Sync failed: ${err.message}`);
      setStatusType('err');
    } finally {
      setSyncing(false);
    }
  };

  const handleForceResync = async () => {
    if (!confirm('Force full resync will discard all local pending changes and download fresh data. Continue?')) return;
    setSyncing(true);
    setStatus('Clearing local cache…');
    setStatusType('info');
    setProgress(10);
    try {
      localStorage.removeItem('pending_manholes');
      localStorage.removeItem('pending_pipelines');
      setProgress(20);
      const { data: manholes, error: me } = await supabase.from('waste_water_manhole').select('*');
      if (me) throw new Error(me.message);
      setProgress(60);
      const { data: pipelines, error: pe } = await supabase.from('waste_water_pipeline').select('*');
      if (pe) throw new Error(pe.message);
      localStorage.setItem('offline_manholes', JSON.stringify(manholes));
      localStorage.setItem('offline_pipelines', JSON.stringify(pipelines));
      localStorage.setItem('last_sync_time', new Date().toISOString());
      setProgress(100);
      setStatus(`Full resync done — ${manholes.length} manholes, ${pipelines.length} pipelines loaded.`);
      setStatusType('ok');
      onSyncComplete?.();
    } catch (err) {
      setStatus(`Force resync failed: ${err.message}`);
      setStatusType('err');
    } finally {
      setSyncing(false);
    }
  };

  const getLastSync = () => {
    const t = localStorage.getItem('last_sync_time');
    return t ? new Date(t).toLocaleString() : 'Never';
  };

  const getPending = () => {
    const m = JSON.parse(localStorage.getItem('pending_manholes') || '[]').length;
    const p = JSON.parse(localStorage.getItem('pending_pipelines') || '[]').length;
    return m + p;
  };

  const pending = getPending();

  const syncOptions = [
    { id: 'all',       icon: '🔄', label: 'Full Sync' },
    { id: 'manholes',  icon: '🕳️', label: 'Manholes' },
    { id: 'pipelines', icon: '📏', label: 'Pipelines' },
    { id: 'download',  icon: '⬇', label: 'Download Only' },
  ];

  return (
    <div className="eng-panel" style={{ '--panel-color-bg': 'rgba(14,165,233,0.1)', '--panel-color-border': 'rgba(14,165,233,0.3)' }}>
      <div className="eng-panel-header">
        <div className="eng-panel-header-icon">🔄</div>
        <div>
          <div className="eng-panel-title">Data Sync</div>
          <div className="eng-panel-sub">Push local changes · Pull remote updates</div>
        </div>
        <button className="eng-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="eng-panel-body">
        {/* Status overview */}
        <div className="eng-info-grid">
          <div className={`eng-stat-card ${pending > 0 ? 'amber' : 'green'}`}>
            <div className="sc-num">{pending}</div>
            <div className="sc-label">Pending</div>
          </div>
          <div className="eng-stat-card blue">
            <div className="sc-num" style={{ fontSize: 13 }}>{getLastSync().split(',')[0]}</div>
            <div className="sc-label">Last Sync</div>
          </div>
        </div>

        {/* Sync type */}
        <div className="eng-section-head">Sync Mode</div>
        <div className="eng-sync-grid">
          {syncOptions.map(opt => (
            <div
              key={opt.id}
              className={`eng-sync-opt${syncType === opt.id ? ' active' : ''}`}
              onClick={() => !syncing && setSyncType(opt.id)}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
            </div>
          ))}
        </div>

        {/* User info */}
        <div style={{ padding: '10px 12px', background: 'var(--bg-base)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 14 }}>
          <div className="eng-info-row">
            <span className="ir-label">User</span>
            <span className="ir-value" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
              {userId ? userId.substring(0, 12) + '…' : 'Unknown'}
            </span>
          </div>
          <div className="eng-info-row">
            <span className="ir-label">Connection</span>
            <span className="ir-value" style={{ color: 'var(--accent-green)', fontSize: 11 }}>● Online</span>
          </div>
        </div>

        {/* Progress */}
        {syncing && (
          <>
            <div className="eng-progress-wrap">
              <div className="eng-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div style={{ textAlign: 'center', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-sec)', marginBottom: 8 }}>
              {progress}%
            </div>
          </>
        )}

        {/* Status */}
        {status && <div className={`eng-status ${statusType}`}>{status}</div>}

        {/* Actions */}
        <div className="eng-btn-row">
          <button
            className="eng-btn eng-btn-primary"
            onClick={handleSync}
            disabled={syncing}
            style={{ flex: 2 }}
          >
            {syncing ? `⏳ Syncing… ${progress}%` : '🔄 Start Sync'}
          </button>
          <button
            className="eng-btn eng-btn-amber"
            onClick={handleForceResync}
            disabled={syncing}
            style={{ flex: 1 }}
          >
            Force
          </button>
        </div>

        {/* History */}
        {syncHistory.length > 0 && (
          <>
            <div className="eng-section-head" style={{ marginTop: 20 }}>Recent Syncs</div>
            {syncHistory.slice(0, 5).map((item, i) => (
              <div key={i} className="eng-history-item">
                <div className="hi-time">{new Date(item.timestamp).toLocaleString()}</div>
                <div className="hi-detail">
                  {item.type} · {item.results.manholesSynced} manholes · {item.results.pipelinesSynced} pipelines
                  {item.results.remoteSynced ? ' · remote pulled' : ''}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
