// src/components/engineer/ShapefileUploader.jsx
import React, { useState, useRef } from 'react';
import api from "../../api/api";

export default function ShapefileUploader({ onUploadComplete, onClose }) {
  const [file,      setFile]     = useState(null);
  const [uploading, setUploading]= useState(false);
  const [progress,  setProgress] = useState(0);
  const [status,    setStatus]   = useState('');
  const [statusCls, setStatusCls]= useState('info');
  const [stats,     setStats]    = useState(null);
  const inputRef = useRef();

  const pick = (f) => {
    if (f && (f.name.endsWith('.zip') || f.name.endsWith('.shp'))) {
      setFile(f);
      setStatus('');
      setStats(null);
    } else {
      setFile(null);
      setStatus('Select a .zip or .shp file');
      setStatusCls('err');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(5);
    setStatus('Uploading file…');
    setStatusCls('info');

    const formData = new FormData();
    formData.append('file', file);
    // Optionally add project_id and layer_type if your UI provides them
    // formData.append('project_id', selectedProjectId);
    // formData.append('layer_type', 'manhole'); // backend detects from geometry anyway

    try {
      const response = await api.post('/upload/shapefile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });
      const { features, message } = response.data;
      setProgress(100);
      setStats({ manholes: features || 0, pipelines: 0, errors: 0 }); // backend returns total features count
      setStatus(message || 'Import successful!');
      setStatusCls('ok');
      if (onUploadComplete) onUploadComplete();
    } catch (err) {
      const errMsg = err.response?.data?.error || err.message;
      setStatus(`Import failed: ${errMsg}`);
      setStatusCls('err');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(74,173,74,0.08)', '--panel-icon-border': 'rgba(74,173,74,0.25)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">📤</div>
        <div>
          <div className="wd-panel-title">Upload Shapefile</div>
          <div className="wd-panel-sub">ZIP archive · Point &amp; LineString</div>
        </div>
        <button className="wd-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="wd-panel-body">
        {/* Drop zone */}
        <div
          className={`wd-drop${file ? ' active' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}
          onDragOver={e => e.preventDefault()}
        >
          <div className="dz-icon">{file ? '✅' : '📁'}</div>
          <div className="dz-text">{file ? file.name : 'Drop .zip shapefile here'}</div>
          <div className="dz-sub">{file ? `${(file.size/1024).toFixed(1)} KB — click to change` : 'or click to browse'}</div>
          <input ref={inputRef} type="file" accept=".zip,.shp" style={{ display:'none' }} onChange={e => pick(e.target.files[0])} disabled={uploading} />
        </div>

        {/* Format guide */}
        <div className="wd-section">Supported Geometry</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          {[
            { icon: '🕳️', title: 'Point → Manholes',  sub: '.shp Point geometry' },
            { icon: '📏', title: 'Line → Pipelines',  sub: '.shp LineString geometry' },
          ].map(f => (
            <div key={f.title} style={{ padding: '10px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-sm)' }}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{f.icon}</div>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-pri)' }}>{f.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>{f.sub}</div>
            </div>
          ))}
        </div>

        {/* Progress */}
        {uploading && (
          <>
            <div className="wd-progress-track"><div className="wd-progress-fill" style={{ width: `${progress}%` }} /></div>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-sec)', marginBottom: 8 }}>{progress}%</div>
          </>
        )}

        {status && <div className={`wd-status ${statusCls}`}>{status}</div>}

        {/* Import stats */}
        {stats && (
          <>
            <div className="wd-section">Import Summary</div>
            <div className="wd-stats" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              <div className="wd-stat green"><div className="s-num">{stats.manholes}</div><div className="s-lbl">Manholes</div></div>
              <div className="wd-stat lime"> <div className="s-num">{stats.pipelines}</div><div className="s-lbl">Pipelines</div></div>
              <div className={`wd-stat ${stats.errors > 0 ? 'red' : 'green'}`}><div className="s-num">{stats.errors}</div><div className="s-lbl">Errors</div></div>
            </div>
          </>
        )}

        <div className="wd-btn-row">
          <button className="wd-btn wd-btn-ghost" onClick={onClose} disabled={uploading}>Close</button>
          <button className="wd-btn wd-btn-primary" onClick={handleUpload} disabled={uploading || !file}>
            {uploading ? `⏳ ${progress}%…` : '⬆ Import'}
          </button>
        </div>
      </div>
    </div>
  );
}
