import React, { useState } from 'react';

const DEFAULTS = {
  autoSync:       true,
  offlineMode:    false,
  clusterMarkers: true,
  showLabels:     true,
  highAccGPS:     true,
  notifications:  true,
  darkMap:        false,
  metricUnits:    true,
};

export default function CollectorSettingsPanel({ onClose }) {
  const [cfg, setCfg] = useState(() => {
    try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('collector_settings') || '{}') }; }
    catch { return DEFAULTS; }
  });

  const [saved, setSaved] = useState(false);

  const toggle = (key) => setCfg(prev => ({ ...prev, [key]: !prev[key] }));

  const save = () => {
    localStorage.setItem('collector_settings', JSON.stringify(cfg));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const reset = () => {
    setCfg(DEFAULTS);
    localStorage.removeItem('collector_settings');
  };

  const groups = [
    {
      label: 'Data & Sync',
      rows: [
        { key: 'autoSync',    label: 'Auto Sync',        sub: 'Automatically push collected data every 5 minutes' },
        { key: 'offlineMode', label: 'Offline Mode',     sub: 'Collect data without internet, sync later' },
        { key: 'metricUnits', label: 'Metric Units',     sub: 'Distances shown in metres/kilometres' },
      ],
    },
    {
      label: 'Map Display',
      rows: [
        { key: 'clusterMarkers', label: 'Cluster Markers', sub: 'Group nearby points at low zoom' },
        { key: 'showLabels',     label: 'Show Labels',     sub: 'Show manhole/feature IDs on map' },
        { key: 'darkMap',        label: 'Dark Basemap',    sub: 'Use a dark map for night work' },
      ],
    },
    {
      label: 'Field & GPS',
      rows: [
        { key: 'highAccGPS',    label: 'High Accuracy GPS', sub: 'Use device GPS at maximum precision' },
        { key: 'notifications', label: 'Notifications',    sub: 'Alert for flagged issues and sync errors' },
      ],
    },
  ];

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(143,220,0,0.08)', '--panel-icon-border': 'rgba(143,220,0,0.25)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">⚙️</div>
        <div>
          <div className="wd-panel-title">Collector Settings</div>
          <div className="wd-panel-sub">App · Map · Field Preferences</div>
        </div>
        <button className="wd-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="wd-panel-body">
        {saved && <div className="wd-status ok" style={{ marginBottom: 12 }}>✓ Settings saved</div>}

        {groups.map(g => (
          <React.Fragment key={g.label}>
            <div className="wd-section">{g.label}</div>
            {g.rows.map(row => (
              <div key={row.key} className="wd-toggle-row">
                <div>
                  <div className="wd-toggle-label">{row.label}</div>
                  <div className="wd-toggle-sub">{row.sub}</div>
                </div>
                <div
                  className={`wd-toggle${cfg[row.key] ? ' on' : ''}`}
                  onClick={() => toggle(row.key)}
                />
              </div>
            ))}
          </React.Fragment>
        ))}

        {/* App info */}
        <div className="wd-section" style={{ marginTop: 20 }}>About</div>
        <div className="wd-info-row"><span className="ir-k">Version</span><span className="ir-v">2.1.0</span></div>
        <div className="wd-info-row"><span className="ir-k">Build</span><span className="ir-v" style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>Collector-2025-prod</span></div>
        <div className="wd-info-row"><span className="ir-k">Basemap</span><span className="ir-v">OpenStreetMap + Esri</span></div>
        <div className="wd-info-row"><span className="ir-k">Routing</span><span className="ir-v">OSRM Public API</span></div>

        <div className="wd-btn-row" style={{ marginTop: 20 }}>
          <button className="wd-btn wd-btn-ghost" onClick={reset}>↺ Reset Defaults</button>
          <button className="wd-btn wd-btn-primary" onClick={save}>💾 Save Settings</button>
        </div>
      </div>
    </div>
  );
}
