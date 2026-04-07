import React from 'react';

export default function CollectorHome({ manholes = [], pipes = [], pendingCount, onClose, onNavigate }) {
  const today = new Date().toLocaleDateString('en-ZW', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });

  const sessionStats = [
    { icon: '🕳️', label: 'Manholes',  val: manholes.length, cls: 'green' },
    { icon: '📏', label: 'Pipelines', val: pipes.length,    cls: 'lime'  },
    { icon: '🔄', label: 'Pending',   val: pendingCount,    cls: pendingCount > 0 ? 'amber' : 'green' },
  ];

  const quickActions = [
    { id: 'collect', icon: '📍', label: 'Collect Manhole',     desc: 'Place a new manhole point',      color: '#8fdc00' },
    { id: 'collect', icon: '📏', label: 'Map Pipeline',         desc: 'Draw a sewer line on the map',   color: '#22d3ee' },
    { id: 'flag',    icon: '🚩', label: 'Flag Blocked Feature', desc: 'Report a blocked pipe or issue', color: '#f59e0b' },
    { id: 'sync',    icon: '🔄', label: 'Sync to Server',       desc: 'Upload pending field data',      color: '#4aad4a' },
  ];

  const tips = [
    { icon: '📍', text: 'Tap the map or use GPS to place manhole points precisely' },
    { icon: '📏', text: 'For pipelines, pick two points — walk between them in the field' },
    { icon: '🌐', text: 'Work offline — data queues locally and syncs when connected' },
    { icon: '🚩', text: 'Flag any blocked, damaged, or suspicious features immediately' },
  ];

  return (
    <div className="fc-panel right" style={{ bottom: 98, right: 14, left: 'auto', transform: 'none', animation: 'fc-panel-right-in 0.25s cubic-bezier(0.16,1,0.3,1)', width: 380 }}>
      <div className="fc-panel-header" style={{ '--panel-icon-bg': 'rgba(143,220,0,0.1)', '--panel-icon-border': 'rgba(143,220,0,0.3)' }}>
        <div className="fc-panel-icon">🦺</div>
        <div>
          <div className="fc-panel-title">Field Overview</div>
          <div className="fc-panel-sub">{today}</div>
        </div>
        <button className="fc-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="fc-panel-body">
        {/* Field stats */}
        <div className="fc-field-stats">
          {sessionStats.map(s => (
            <div key={s.label} className={`fc-fstat ${s.cls}`}>
              <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
              <div className="fs-num">{s.val}</div>
              <div className="fs-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="fc-section">Quick Actions</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {quickActions.map((a, i) => (
            <button
              key={i}
              onClick={() => { onClose(); onNavigate(a.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 14px',
                background: 'rgba(6,18,6,0.8)',
                border: '1px solid rgba(45,138,45,0.2)',
                borderRadius: 10, cursor: 'pointer',
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = a.color; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = 'rgba(45,138,45,0.2)'; }}
            >
              <span style={{ fontSize: 20 }}>{a.icon}</span>
              <div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#e8f5e8' }}>
                  {a.label}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(122,184,122,0.7)', marginTop: 2 }}>
                  {a.desc}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Field tips */}
        <div className="fc-section">Field Tips</div>
        {tips.map((t, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(45,138,45,0.12)' }}>
            <span style={{ fontSize: 14, flexShrink: 0 }}>{t.icon}</span>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(122,184,122,0.7)', lineHeight: 1.5 }}>{t.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}