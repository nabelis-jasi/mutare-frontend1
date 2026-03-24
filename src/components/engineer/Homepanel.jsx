import React, { useMemo } from 'react';

export default function HomePanel({ manholes = [], pipes = [], onClose, onNavigate }) {
  const stats = useMemo(() => {
    const blocked_m  = manholes.filter(m => m.status === 'Blocked' || m.status === 'Out of Service').length;
    const maintain_m = manholes.filter(m => m.status === 'Needs Maintenance').length;
    const blocked_p  = pipes.filter(p => p.status === 'Blocked').length;
    const flagged    = [...manholes, ...pipes].filter(f => f.flagged && !f.flag_resolved).length;
    return { blocked_m, maintain_m, blocked_p, flagged };
  }, [manholes, pipes]);

  const cards = [
    { icon: '🕳️', title: 'Manholes',    val: manholes.length, sub: `${stats.blocked_m} blocked`,  cls: stats.blocked_m > 0 ? 'red' : 'green' },
    { icon: '📏', title: 'Pipelines',   val: pipes.length,    sub: `${stats.blocked_p} blocked`,  cls: stats.blocked_p > 0 ? 'amber' : 'lime' },
    { icon: '🔧', title: 'Maintenance', val: stats.maintain_m,sub: 'need attention',              cls: stats.maintain_m > 0 ? 'amber' : 'green' },
    { icon: '🚩', title: 'Open Flags',  val: stats.flagged,   sub: 'pending review',              cls: stats.flagged > 0 ? 'red' : 'green' },
  ];

  const quickActions = [
    { id: 'nav',      icon: '🧭', label: 'Navigate to Site', color: '#22d3ee' },
    { id: 'flags',    icon: '🚩', label: 'Review Flags',     color: '#f59e0b' },
    { id: 'sync',     icon: '🔄', label: 'Sync Data',        color: '#4aad4a' },
    { id: 'uploader', icon: '📤', label: 'Upload Data',      color: '#8fdc00' },
  ];

  const recentActivity = [
    { dot: 'green', text: <><strong>MH-0042</strong> status updated to Normal</>,       time: '2m ago' },
    { dot: 'amber', text: <><strong>PL-0118</strong> flagged for maintenance review</>,  time: '14m ago' },
    { dot: 'green', text: <><strong>12 manholes</strong> digitised — Arlington zone</>,  time: '1h ago' },
    { dot: 'red',   text: <><strong>MH-0091</strong> marked Blocked — Msasa sector</>,   time: '2h ago' },
    { dot: 'green', text: <>Data sync completed — <strong>1,204</strong> records</>,     time: '3h ago' },
  ];

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(143,220,0,0.1)', '--panel-icon-border': 'rgba(143,220,0,0.3)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">🏠</div>
        <div>
          <div className="wd-panel-title">Dashboard Home</div>
          <div className="wd-panel-sub">Network overview · {new Date().toLocaleDateString('en-ZW', { weekday: 'short', day: 'numeric', month: 'short' })}</div>
        </div>
        <button className="wd-panel-close" onClick={onClose}>×</button>
      </div>

      <div className="wd-panel-body">

        {/* Network stat cards */}
        <div className="wd-section">Network Status</div>
        <div className="wd-home-grid">
          {cards.map(c => (
            <div key={c.title} className={`wd-home-card ${c.cls}`}>
              <div className="hc-icon">{c.icon}</div>
              <div className="hc-title">{c.title}</div>
              <div className="hc-val">{c.val}</div>
              <div className="hc-sub">{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Quick actions */}
        <div className="wd-section">Quick Actions</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 16 }}>
          {quickActions.map(a => (
            <button
              key={a.id}
              onClick={() => { onClose(); onNavigate(a.id); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 12px',
                background: 'var(--bg-raised)',
                border: `1px solid var(--border)`,
                borderRadius: 'var(--r-md)',
                cursor: 'pointer',
                transition: 'all 0.15s',
                color: 'var(--text-sec)',
                fontFamily: 'var(--font-display)',
                fontSize: 12, fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = a.color; e.currentTarget.style.color = a.color; }}
              onMouseOut={e  => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
            >
              <span style={{ fontSize: 18 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>

        {/* Network health bar */}
        <div className="wd-section">Network Health</div>
        <div style={{ marginBottom: 14 }}>
          {[
            { label: 'Manholes Operational', pct: manholes.length > 0 ? Math.round(((manholes.length - stats.blocked_m) / manholes.length) * 100) : 100, cls: 'green' },
            { label: 'Pipelines Operational', pct: pipes.length > 0 ? Math.round(((pipes.length - stats.blocked_p) / pipes.length) * 100) : 100, cls: 'lime'  },
          ].map(h => (
            <div key={h.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-sec)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h.label}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent-lime)', fontWeight: 600 }}>{h.pct}%</span>
              </div>
              <div className="wd-progress-track">
                <div className="wd-progress-fill" style={{ width: `${h.pct}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Recent activity */}
        <div className="wd-section">Recent Activity</div>
        {recentActivity.map((a, i) => (
          <div key={i} className="wd-activity">
            <div className={`a-dot ${a.dot}`} />
            <div className="a-text">{a.text}</div>
            <div className="a-time">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
}