import React, { useState } from 'react';
import MapView from '../MapView';
import DataEditor from './DataEditor';
import ShapefileUploader from './ShapefileUploader';
import DataSync from './DataSync';
import FlagManager from './FlagManager';
import NavigationTool from './NavigationTool';
import HomePanel from './HomePanel';
import ProfilePanel from './ProfilePanel';
import SettingsPanel from './SettingsPanel';
import './dashboard.css';

export default function EngineerDashboard({ manholes, pipes, userId, role, onDataRefresh, userProfile }) {
  const [activePanel, setActivePanel] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setActivePanel('editor');
  };

  const toggle = (id) => setActivePanel(prev => prev === id ? null : id);

  const tools = [
    { id: 'home',     icon: '🏠', tip: 'Home Overview',    color: '#4aad4a' },
    { id: 'nav',      icon: '🧭', tip: 'GPS Navigation',   color: '#22d3ee' },
    { id: 'editor',   icon: '✏️', tip: 'Edit Records',     color: '#8fdc00' },
    { id: 'uploader', icon: '📤', tip: 'Upload Shapefile', color: '#4aad4a' },
    { id: 'sync',     icon: '🔄', tip: 'Sync Data',        color: '#22d3ee' },
    { id: 'flags',    icon: '🚩', tip: 'Manage Flags',     color: '#f59e0b' },
  ];

  return (
    <div className="wd-root">

      {/* ── TOP BAR ── */}
      <header className="wd-topbar">
        <div className="wd-brand">
          <div className="wd-brand-logo">🪣</div>
          <div>
            <div className="wd-brand-name">WasteGIS</div>
            <div className="wd-brand-tagline">Wastewater Network Command</div>
          </div>
        </div>

        <div className="wd-topbar-sep" />

        <div className="wd-chips">
          <div className="wd-chip"><span className="dot dot-green" />{manholes?.length ?? 0} Manholes</div>
          <div className="wd-chip"><span className="dot dot-lime"  />{pipes?.length ?? 0} Pipelines</div>
          <div className="wd-chip"><span className="dot dot-amber" />Live</div>
        </div>

        <div className="wd-topbar-actions">
          <button
            className={`wd-icon-btn${activePanel === 'profile'  ? ' active' : ''}`}
            onClick={() => toggle('profile')}  title="User Profile"
          >👤</button>
          <button
            className={`wd-icon-btn${activePanel === 'settings' ? ' active' : ''}`}
            onClick={() => toggle('settings')} title="Settings"
          >⚙️</button>
          <div className="wd-role-pill">{role ?? 'Engineer'}</div>
        </div>
      </header>

      {/* ── MAP ── */}
      <div className="wd-map-wrap">
        <MapView
          manholes={manholes}
          pipes={pipes}
          role={role}
          userId={userId}
          onFeatureClick={handleFeatureClick}
          onMapReady={setMapInstance}
        />
      </div>

      {/* ── LEFT RAIL ── */}
      <nav className="wd-rail">
        {tools.map((t, i) => (
          <React.Fragment key={t.id}>
            {i === 2 && <div className="wd-rail-sep" />}
            <button
              className={`wd-rail-btn${activePanel === t.id ? ' active' : ''}`}
              style={{ '--rail-color': t.color }}
              onClick={() => toggle(t.id)}
              data-tip={t.tip}
            >
              {t.icon}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* ── PANELS ── only one visible at a time, each handles its own position ── */}
      {activePanel === 'home'     && <HomePanel manholes={manholes} pipes={pipes} onClose={() => setActivePanel(null)} onNavigate={toggle} />}
      {activePanel === 'nav'      && <NavigationTool map={mapInstance} onClose={() => setActivePanel(null)} />}
      {activePanel === 'editor'   && <DataEditor feature={selectedFeature} onSave={() => { setActivePanel(null); onDataRefresh(); }} onCancel={() => setActivePanel(null)} />}
      {activePanel === 'uploader' && <ShapefileUploader onUploadComplete={onDataRefresh} onClose={() => setActivePanel(null)} />}
      {activePanel === 'sync'     && <DataSync userId={userId} onSyncComplete={onDataRefresh} onClose={() => setActivePanel(null)} />}
      {activePanel === 'flags'    && <FlagManager onFlagManaged={onDataRefresh} onClose={() => setActivePanel(null)} />}
      {activePanel === 'profile'  && <ProfilePanel userId={userId} role={role} userProfile={userProfile} onClose={() => setActivePanel(null)} />}
      {activePanel === 'settings' && <SettingsPanel onClose={() => setActivePanel(null)} />}
    </div>
  );
}