// src/components/engineer/DataEditor.jsx
import React, { useState } from 'react';
import api from "../../api/api"; // adjust path

export default function DataEditor({ feature, onSave, onCancel }) {
  const [formData, setFormData] = useState(feature || {});
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);

  const isManhole = feature?.type === 'manhole';

  const handleSave = async () => {
    setSaving(true);
    try {
      const endpoint = isManhole ? `/manholes/${feature.gid}` : `/pipelines/${feature.gid}`;
      await api.put(endpoint, formData);
      setSaved(true);
      setTimeout(onSave, 700);
    } catch (err) {
      alert('Save error: ' + (err.response?.data?.error || err.message));
    } finally {
      setSaving(false);
    }
  };

  const editableKeys = Object.keys(formData).filter(k => !['gid','geom','type','feature_type'].includes(k));
  const pairs = [];
  for (let i = 0; i < editableKeys.length; i += 2) pairs.push(editableKeys.slice(i, i + 2));

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(143,220,0,0.08)', '--panel-icon-border': 'rgba(143,220,0,0.25)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">✏️</div>
        <div>
          <div className="wd-panel-title">Edit {isManhole ? 'Manhole' : 'Pipeline'}</div>
          <div className="wd-panel-sub">GID: {feature?.gid ?? '—'} · API record</div>
        </div>
        <button className="wd-panel-close" onClick={onCancel}>×</button>
      </div>

      <div className="wd-panel-body">
        {/* Feature badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 14px',
          background: 'var(--bg-raised)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--r-md)',
          marginBottom: 16,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 'var(--r-sm)',
            background: isManhole ? 'rgba(143,220,0,0.08)' : 'rgba(34,211,238,0.08)',
            border: `1px solid ${isManhole ? 'rgba(143,220,0,0.3)' : 'rgba(34,211,238,0.3)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}>
            {isManhole ? '🕳️' : '📏'}
          </div>
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-pri)' }}>
              {isManhole ? 'Manhole' : 'Pipeline'} Record
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-sec)', marginTop: 2 }}>
              Editing all attributes — saved directly to database
            </div>
          </div>
        </div>

        <div className="wd-section">Attributes</div>

        {pairs.map((pair, pi) => (
          <div key={pi} className="wd-field-pair">
            {pair.map(key => (
              <div key={key} className="wd-field">
                <label className="wd-label">{key.replace(/_/g, ' ')}</label>
                <input
                  className="wd-input"
                  value={formData[key] ?? ''}
                  onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                />
              </div>
            ))}
          </div>
        ))}

        {saved && <div className="wd-status ok" style={{ marginTop: 12 }}>✓ Saved successfully</div>}

        <div className="wd-btn-row">
          <button className="wd-btn wd-btn-ghost"    onClick={onCancel} disabled={saving}>Cancel</button>
          <button className="wd-btn wd-btn-primary"  onClick={handleSave} disabled={saving || saved}>
            {saving ? '⏳ Saving…' : saved ? '✓ Saved' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
