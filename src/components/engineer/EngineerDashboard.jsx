// src/components/engineer/EngineerDashboard.jsx
import React, { useState, useRef, useEffect } from 'react';
import api from "../../api/api";
import MapView from '../MapView';
import DataEditor from './DataEditor';
import ShapefileUploader from './ShapefileUploader';
import DataSync from './DataSync';
import FlagManager from './FlagManager';
import HomePanel from './HomePanel';
import ProfilePanel from './ProfilePanel';
import SettingsPanel from './SettingsPanel';
import FormBuilder from './FormBuilder';
import FormList from './FormList';
import SubmissionsList from './SubmissionsList';
import PendingEdits from './PendingEdits';
import ConnectionsPanel from './ConnectionPanel';
import AnalyticsDashboard from './AnalyticsDashboard';
import './Dashboard.css';

export default function EngineerDashboard({ user, onLogout }) {
  // Extract user info from props
  const userId = user?.id;
  const role = user?.role || 'engineer';
  const userProfile = user;

  const [activePanel, setActivePanel] = useState(null);
  const [selectedFeature, setFeature] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [pendingEditCount, setPendingEditCount] = useState(0);
  
  // Data state for manholes and pipelines (fetched from active connection)
  const [manholes, setManholes] = useState([]);
  const [pipes, setPipelines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectionActive, setConnectionActive] = useState(false);

  // Fetch pending edit count for badge
  useEffect(() => { 
    fetchPendingCount(); 
  }, []);

  // Fetch manholes and pipelines when active connection exists
  useEffect(() => {
    if (connectionActive) {
      fetchData();
    }
  }, [connectionActive]);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/asset-edits?status=pending');
      setPendingEditCount(res.data.length ?? 0);
    } catch (err) {
      console.error('Error fetching pending edit count', err);
      setPendingEditCount(0);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [manholesRes, pipelinesRes] = await Promise.all([
        api.get('/manholes'),
        api.get('/pipelines')
      ]);
      setManholes(manholesRes.data || []);
      setPipelines(pipelinesRes.data || []);
    } catch (err) {
      console.error('Error fetching spatial data', err);
      // If no active connection, don't show error repeatedly
      if (err.response?.status === 503) {
        setConnectionActive(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const checkConnection = async () => {
    try {
      await api.get('/connections/active');
      setConnectionActive(true);
    } catch (err) {
      setConnectionActive(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleFeatureClick = (feature) => {
    setFeature(feature);
    setActivePanel('editor');
  };

  const toggle = (id) => {
    setActivePanel(prev => prev === id ? null : id);
    setSelectedForm(null);
  };

  const handleSelectForm = (form) => {
    setSelectedForm(form);
    setActivePanel('formBuilder');
  };

  const handleFormSaved = () => {
    setSelectedForm(null);
    onDataRefresh?.();
  };

  const handleDataRefresh = () => {
    fetchData();
    fetchPendingCount();
  };

  const handleConnectionActivated = () => {
    checkConnection();
    fetchData();
  };

  // Tool rail definitions
  const tools = [
    { id: 'home',        icon: '🏠', label: 'Home',        color: '#4aad4a', desc: 'Overview & stats' },
    { id: 'connections', icon: '🔌', label: 'Connections', color: '#22d3ee', desc: 'Manage DB & GeoServer' },
    { id: 'analytics',   icon: '📊', label: 'Analytics',   color: '#f59e0b', desc: 'Reports & KPIs' },
    { id: 'editor',      icon: '✏️', label: 'Edit',        color: '#8fdc00', desc: 'Edit manhole/pipeline' },
    { id: 'uploader',    icon: '📤', label: 'Upload',      color: '#4aad4a', desc: 'Import shapefile' },
    { id: 'sync',        icon: '🔄', label: 'Sync',        color: '#22d3ee', desc: 'Push / pull data' },
    { id: 'flags',       icon: '🚩', label: 'Flags',       color: '#f59e0b', desc: 'Review issues' },
    { id: 'formBuilder', icon: '📝', label: 'Forms',       color: '#8fdc00', desc: 'Create/edit forms' },
    { id: 'submissions', icon: '📋', label: 'Submissions', color: '#f59e0b', desc: 'Review submissions' },
    { id: 'pendingEdits',icon: '🔖', label: 'Edits',       color: '#f59e0b', desc: 'Pending asset edits', badge: pendingEditCount },
    { id: 'profile',     icon: '👤', label: 'Profile',     color: '#4aad4a', desc: 'User profile' },
    { id: 'settings',    icon: '⚙️', label: 'Settings',    color: '#4aad4a', desc: 'App settings' },
  ];

  // Show loading state while checking connection or fetching data
  if (loading && connectionActive) {
    return (
      <div className="wd-root">
        <div className="loading-container">Loading wastewater data...</div>
      </div>
    );
  }

  return (
    <div className="wd-root">

      {/* TOP BAR */}
      <header className="wd-topbar">
        <div className="wd-brand">
          <div className="wd-brand-logo">🪣</div>
          <div>
            <div className="wd-brand-name">WWGIS</div>
            <div className="wd-brand-tagline">Wastewater Network</div>
          </div>
        </div>

        <div className="wd-topbar-sep" />

        <div className="wd-chips">
          <div className="wd-chip">
            <span className="dot dot-green" />
            {manholes?.length ?? 0} Manholes
          </div>
          <div className="wd-chip">
            <span className="dot dot-lime" />
            {pipes?.length ?? 0} Pipelines
          </div>
          <div className="wd-chip">
            <span className="dot dot-amber" />
            {connectionActive ? 'Connected' : 'No Connection'}
          </div>
        </div>

        <div className="wd-topbar-actions">
          <button 
            className={`wd-icon-btn${activePanel === 'profile' ? ' active' : ''}`}
            onClick={() => toggle('profile')}  
            title="User Profile"
          >
            👤
          </button>
          <button 
            className={`wd-icon-btn${activePanel === 'settings' ? ' active' : ''}`}
            onClick={() => toggle('settings')} 
            title="Settings"
          >
            ⚙️
          </button>
          {onLogout && (
            <button className="wd-icon-btn" onClick={onLogout} title="Logout">
              ⎋
            </button>
          )}
          <div className="wd-role-pill">{role ?? 'Engineer'}</div>
        </div>
      </header>

      {/* MAP */}
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

      {/* LEFT RAIL */}
      <nav className="wd-rail">
        {tools.map((t, i) => (
          <React.Fragment key={t.id}>
            {i === 2 && <div className="wd-rail-sep" />}
            <button
              className={`wd-rail-btn${activePanel === t.id ? ' active' : ''}`}
              style={{ '--rail-color': t.color }}
              onClick={() => toggle(t.id)}
              title={`${t.label} — ${t.desc}`}
            >
              {t.badge > 0 && (
                <span className="wd-rail-badge">{t.badge > 99 ? '99+' : t.badge}</span>
              )}
              <span style={{ fontSize: 16, lineHeight: 1, display: 'block' }}>{t.icon}</span>
              <span style={{
                display: 'block',
                fontFamily: 'var(--font-display)',
                fontSize: 7,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: activePanel === t.id ? 'var(--text-pri)' : 'var(--text-dim)',
                marginTop: 1,
                lineHeight: 1,
                textAlign: 'center',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                maxWidth: '42px',
                textOverflow: 'ellipsis',
              }}>
                {t.label}
              </span>
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* PANELS */}
      {activePanel === 'home' && (
        <HomePanel
          manholes={manholes}
          pipes={pipes}
          onClose={() => setActivePanel(null)}
          onNavigate={toggle}
        />
      )}

      {activePanel === 'connections' && (
        <ConnectionsPanel 
          onClose={() => setActivePanel(null)} 
          onConnectionActivated={handleConnectionActivated}
        />
      )}

      {activePanel === 'analytics' && (
        <AnalyticsDashboard onClose={() => setActivePanel(null)} />
      )}

      {activePanel === 'editor' && (
        <DataEditor
          feature={selectedFeature}
          onSave={() => { setActivePanel(null); handleDataRefresh(); }}
          onCancel={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'uploader' && (
        <ShapefileUploader
          onUploadComplete={handleDataRefresh}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'sync' && (
        <DataSync
          userId={userId}
          onSyncComplete={handleDataRefresh}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'flags' && (
        <FlagManager
          onFlagManaged={handleDataRefresh}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* FORMS: list or builder */}
      {activePanel === 'formBuilder' && (
        <>
          {!selectedForm ? (
            <FormList
              onSelectForm={handleSelectForm}
              onClose={() => setActivePanel(null)}
              onCreateNew={() => setSelectedForm({})}
            />
          ) : (
            <FormBuilder
              form={selectedForm}
              onSaved={handleFormSaved}
              onCancel={() => setSelectedForm(null)}
            />
          )}
        </>
      )}

      {/* SUBMISSIONS REVIEW */}
      {activePanel === 'submissions' && (
        <SubmissionsList
          onClose={() => setActivePanel(null)}
          onRefresh={handleDataRefresh}
        />
      )}

      {/* PENDING ASSET EDITS */}
      {activePanel === 'pendingEdits' && (
        <PendingEdits
          onClose={() => setActivePanel(null)}
          onEditProcessed={() => { fetchPendingCount(); handleDataRefresh(); }}
        />
      )}

      {activePanel === 'profile' && (
        <ProfilePanel
          userId={userId}
          role={role}
          userProfile={userProfile}
          onClose={() => setActivePanel(null)}
          onLogout={onLogout}
        />
      )}

      {activePanel === 'settings' && (
        <SettingsPanel onClose={() => setActivePanel(null)} />
      )}
    </div>
  );
}
