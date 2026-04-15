// src/components/engineer/EngineerDashboard.jsx
import React, { useState, useEffect } from 'react';
import api from "../../api/api";
import MapView from '../MapView';
import AnalyticsDashboard from './AnalyticsDashboard';
import DataEditor from './DataEditor';
import ShapefileUploader from './ShapefileUploader';
import DataSync from './DataSync';
import FlagManager from './FlagManager';
import FormList from './FormList';
import FormBuilder from './FormBuilder';
import SubmissionsList from './SubmissionsList';
import PendingEdits from './PendingEdits';
import HomePanel from './HomePanel';
import ProfilePanel from './ProfilePanel';
import SettingsPanel from './SettingsPanel';

// Drawers and modals
import DrawerDownload from '../../containers/DrawerDownload';
import DrawerUpload from '../../containers/DrawerUpload';
import DrawerMap from '../../containers/DrawerMap';
import DrawerEntry from '../../containers/DrawerEntry';
import ModalDeleteEntry from '../../containers/ModalDeleteEntry';
import ModalViewEntry from '../../containers/ModalViewEntry';
import WaitOverlay from '../../containers/WaitOverlay';

export default function EngineerDashboard({ user, onLogout }) {
  const userId = user?.id;
  const role = user?.role || 'engineer';
  const userProfile = user;

  const [activeTab, setActiveTab] = useState('home');
  const [selectedFeature, setFeature] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [uploadedLayers, setUploadedLayers] = useState([]); // { id, geojson, type, name }
  const [pendingEditCount, setPendingEditCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Drawers and modals state
  const [drawerOpen, setDrawerOpen] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [modalDelete, setModalDelete] = useState({ isOpen: false, entryUuid: null, entryTitle: '' });
  const [modalView, setModalView] = useState({ isOpen: false, headers: [], answers: [], entryTitle: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchPendingCount();
  }, []);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get('/asset-edits?status=pending');
      setPendingEditCount(res.data.length ?? 0);
    } catch {
      setPendingEditCount(0);
    }
  };

  const handleDataRefresh = () => {
    fetchPendingCount();
  };

  const handleGeoJsonLoaded = (geojson, layerType) => {
    const newLayer = {
      id: Date.now(),
      geojson,
      type: layerType,
      name: `${layerType} ${uploadedLayers.length + 1}`
    };
    setUploadedLayers(prev => [...prev, newLayer]);
  };

  // Handlers for drawers and modals (unchanged from your version)
  const handleDownload = async (format, includeMedia) => { /* ... */ };
  const handleUpload = async (file) => { /* ... */ };
  const handleViewEntry = (headers, answers, entryTitle) => { /* ... */ };
  const handleDeleteEntry = (entryUuid, entryTitle) => { /* ... */ };
  const confirmDelete = async () => { /* ... */ };
  const handleEditEntry = (entryUuid) => { /* ... */ };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomePanel manholes={[]} pipes={[]} onNavigate={setActiveTab} onClose={() => {}} />;
      case 'analytics':
        return <AnalyticsDashboard onClose={() => setActiveTab('home')} />;
      case 'editor':
        return <DataEditor feature={selectedFeature} onSave={() => { setActiveTab('home'); handleDataRefresh(); }} onCancel={() => setActiveTab('home')} />;
      case 'uploader':
        return <ShapefileUploader onUploadComplete={handleDataRefresh} onClose={() => setActiveTab('home')} onGeoJsonLoaded={handleGeoJsonLoaded} />;
      case 'sync':
        return <DataSync userId={userId} onSyncComplete={handleDataRefresh} onClose={() => setActiveTab('home')} />;
      case 'flags':
        return <FlagManager onFlagManaged={handleDataRefresh} onClose={() => setActiveTab('home')} />;
      case 'forms':
        return !selectedForm ? (
          <FormList onSelectForm={setSelectedForm} onClose={() => setActiveTab('home')} onCreateNew={() => setSelectedForm({})} />
        ) : (
          <FormBuilder form={selectedForm} onSaved={() => { setSelectedForm(null); handleDataRefresh(); }} onCancel={() => setSelectedForm(null)} />
        );
      case 'submissions':
        return (
          <SubmissionsList
            onClose={() => setActiveTab('home')}
            onRefresh={handleDataRefresh}
            onViewEntry={handleViewEntry}
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
            onOpenDrawer={setDrawerOpen}
          />
        );
      case 'edits':
        return <PendingEdits onClose={() => setActiveTab('home')} onEditProcessed={() => { fetchPendingCount(); handleDataRefresh(); }} />;
      case 'profile':
        return <ProfilePanel userId={userId} role={role} userProfile={userProfile} onClose={() => setActiveTab('home')} onLogout={onLogout} />;
      case 'settings':
        return <SettingsPanel onClose={() => setActiveTab('home')} />;
      default:
        return <HomePanel manholes={[]} pipes={[]} onNavigate={setActiveTab} onClose={() => {}} />;
    }
  };

  // Inline styles (keep your existing styles)
  const styles = { /* your existing styles */ };

  return (
    <div style={styles.root}>
      <header style={styles.topbar}>...</header>
      <div style={styles.mainLayout}>
        <div style={styles.mapContainer}>
          <MapView uploadedLayers={uploadedLayers} onFeatureClick={(f) => { setFeature(f); setActiveTab('editor'); }} />
        </div>
        <div style={styles.panelContainer}>
          <div style={styles.tabBar}>
            <button style={{ ...styles.tab, ...(activeTab === 'home' ? styles.activeTab : {}) }} onClick={() => setActiveTab('home')}>🏠 Home</button>
            <button style={{ ...styles.tab, ...(activeTab === 'analytics' ? styles.activeTab : {}) }} onClick={() => setActiveTab('analytics')}>📊 Analytics</button>
            <button style={{ ...styles.tab, ...(activeTab === 'forms' ? styles.activeTab : {}) }} onClick={() => setActiveTab('forms')}>📝 Forms</button>
            <button style={{ ...styles.tab, ...(activeTab === 'submissions' ? styles.activeTab : {}) }} onClick={() => setActiveTab('submissions')}>📋 Submissions</button>
            <button style={{ ...styles.tab, ...(activeTab === 'edits' ? styles.activeTab : {}) }} onClick={() => setActiveTab('edits')}>✏️ Edits {pendingEditCount > 0 && <span style={styles.badge}>{pendingEditCount}</span>}</button>
            <button style={{ ...styles.tab, ...(activeTab === 'flags' ? styles.activeTab : {}) }} onClick={() => setActiveTab('flags')}>🚩 Flags</button>
            <button style={{ ...styles.tab, ...(activeTab === 'uploader' ? styles.activeTab : {}) }} onClick={() => setActiveTab('uploader')}>📤 Upload</button>
            <button style={{ ...styles.tab, ...(activeTab === 'sync' ? styles.activeTab : {}) }} onClick={() => setActiveTab('sync')}>🔄 Sync</button>
          </div>
          <div style={styles.panelContent}>
            {renderContent()}
          </div>
        </div>
      </div>

      {/* Drawers and modals (unchanged) */}
      {drawerOpen === 'download' && <DrawerDownload onClose={() => setDrawerOpen(null)} onDownload={handleDownload} />}
      {drawerOpen === 'upload' && <DrawerUpload onClose={() => setDrawerOpen(null)} onUpload={handleUpload} />}
      {drawerOpen === 'map' && selectedEntry && <DrawerMap entries={[selectedEntry]} onClose={() => setDrawerOpen(null)} />}
      {drawerOpen === 'entry' && selectedEntry && <DrawerEntry entry={selectedEntry} onClose={() => setDrawerOpen(null)} />}

      <ModalDeleteEntry isOpen={modalDelete.isOpen} onClose={() => setModalDelete({ isOpen: false, entryUuid: null, entryTitle: '' })} onConfirm={confirmDelete} entryTitle={modalDelete.entryTitle} />
      <ModalViewEntry isOpen={modalView.isOpen} onClose={() => setModalView({ isOpen: false, headers: [], answers: [], entryTitle: '' })} headers={modalView.headers} answers={modalView.answers} entryTitle={modalView.entryTitle} />
      <WaitOverlay isVisible={isLoading} message="Processing..." />
    </div>
  );
}
