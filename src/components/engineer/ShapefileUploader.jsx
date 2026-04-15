// src/components/engineer/ShapefileUploader.jsx
import React, { useState, useRef } from 'react';
import api from "../../api/api";

export default function ShapefileUploader({ onUploadComplete, onClose, onGeoJsonLoaded }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [statusCls, setStatusCls] = useState('info');
  const [layerType, setLayerType] = useState('manhole'); // manhole, pipeline, suburb
  const inputRef = useRef();

  const pick = (f) => {
    if (f && (f.name.endsWith('.zip') || f.name.endsWith('.shp'))) {
      setFile(f);
      setStatus('');
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

    try {
      const response = await api.post('/upload/shapefile/geojson', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(percent);
        },
      });
      const geojson = response.data;
      setProgress(100);
      setStatus('File processed successfully!');
      setStatusCls('ok');

      if (onGeoJsonLoaded) {
        onGeoJsonLoaded(geojson, layerType);
      }
      if (onUploadComplete) onUploadComplete();
      // Optionally close panel after delay
      setTimeout(() => onClose(), 1500);
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
          <div className="wd-panel-sub">ZIP archive · Point, Line, Polygon</div>
        </div>
        <button className="wd-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="wd-panel-body">
        {/* Layer type selector */}
        <div className="wd-section">Layer Type</div>
        <select
          value={layerType}
          onChange={(e) => setLayerType(e.target.value)}
          style={{ width: '100%', padding: '0.5rem', marginBottom: '1rem', borderRadius: '6px', border: '1px solid #ccc' }}
        >
          <option value="manhole">Manhole (Point)</option>
          <option value="pipeline">Pipeline (Line)</option>
          <option value="suburb">Suburb (Polygon)</option>
        </select>

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
            { icon: '🏘️', title: 'Polygon → Suburbs', sub: '.shp Polygon geometry' },
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
