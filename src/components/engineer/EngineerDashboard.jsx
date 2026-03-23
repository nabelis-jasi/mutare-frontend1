import React, { useState, useEffect } from 'react';
import MapView from '../MapView';
import DataEditor from './DataEditor';
import ShapefileUploader from './ShapefileUploader';
import DataSync from './DataSync';
import FlagManager from './FlagManager';

export default function EngineerDashboard({ manholes, pipes, userId, role, onDataRefresh }) {
  // Navigation State: 'none', 'uploader', 'sync', 'flags', 'editor'
  const [activePanel, setActivePanel] = useState('none');
  const [selectedFeature, setSelectedFeature] = useState(null);
  
  // Base Layer State (to be passed to MapView)
  const [baseLayer, setBaseLayer] = useState('google_hybrid');

  // Handle clicking a feature on the map
  const handleFeatureClick = (feature) => {
    setSelectedFeature(feature);
    setActivePanel('editor');
  };

  // Switch to editor from the Flag Manager
  const handleEditFromFlag = (feature) => {
    setSelectedFeature(feature);
    setActivePanel('editor');
  };

  // UI styles to prevent conflicts
  const styles = {
    layout: {
      display: 'flex',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif'
    },
    sidebar: {
      width: activePanel === 'none' ? '60px' : '400px',
      backgroundColor: '#2c3e50',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      zIndex: 1001,
      boxShadow: '2px 0 10px rgba(0,0,0,0.2)'
    },
    navIcons: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '10px 0',
      borderRight: activePanel !== 'none' ? '1px solid #34495e' : 'none',
      width: '60px'
    },
    navButton: (active) => ({
      width: '40px',
      height: '40px',
      margin: '10px 0',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: active ? '#3498db' : 'transparent',
      color: 'white',
      cursor: 'pointer',
      fontSize: '1.2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.2s'
    }),
    panelContent: {
      flex: 1,
      backgroundColor: '#ecf0f1',
      color: '#333',
      display: activePanel === 'none' ? 'none' : 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      position: 'relative'
    },
    mapContainer: {
      flex: 1,
      position: 'relative'
    },
    layerToggle: {
      position: 'absolute',
      bottom: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      padding: '10px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
    }
  };

  return (
    <div style={styles.layout}>
      {/* SIDEBAR NAVIGATION */}
      <div style={styles.sidebar}>
        <div style={{ display: 'flex', height: '100%' }}>
          {/* Narrow Icon Bar */}
          <div style={styles.navIcons}>
            <button 
              title="Upload Data"
              style={styles.navButton(activePanel === 'uploader')} 
              onClick={() => setActivePanel(activePanel === 'uploader' ? 'none' : 'uploader')}
            >
              📤
            </button>
            <button 
              title="Sync Database"
              style={styles.navButton(activePanel === 'sync')} 
              onClick={() => setActivePanel(activePanel === 'sync' ? 'none' : 'sync')}
            >
              🔄
            </button>
            <button 
              title="Manage Flags"
              style={styles.navButton(activePanel === 'flags')} 
              onClick={() => setActivePanel(activePanel === 'flags' ? 'none' : 'flags')}
            >
              🏁
            </button>
            {selectedFeature && (
              <button 
                title="Edit Selected"
                style={styles.navButton(activePanel === 'editor')} 
                onClick={() => setActivePanel('editor')}
              >
                ✏️
              </button>
            )}
          </div>

          {/* Expanded Panel Content */}
          <div style={styles.panelContent}>
            <div style={{ padding: '20px' }}>
              {activePanel === 'uploader' && (
                <ShapefileUploader onUploadComplete={() => { onDataRefresh(); setActivePanel('none'); }} />
              )}
              {activePanel === 'sync' && (
                <DataSync userId={userId} onSyncComplete={onDataRefresh} />
              )}
              {activePanel === 'flags' && (
                <FlagManager 
                  onFlagManaged={onDataRefresh} 
                  onEditRequest={handleEditFromFlag} // Connects Flags to Editor
                />
              )}
              {activePanel === 'editor' && selectedFeature && (
                <DataEditor 
                  feature={selectedFeature} 
                  onSave={() => { onDataRefresh(); setActivePanel('none'); }} 
                  onCancel={() => setActivePanel('none')} 
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MAIN MAP AREA */}
      <div style={styles.mapContainer}>
        <MapView 
          manholes={manholes} 
          pipes={pipes} 
          role={role} 
          userId={userId}
          onFeatureClick={handleFeatureClick}
          baseLayer={baseLayer} // Pass the "google_hybrid" preference here
        />

        {/* Layer Switcher Overlay */}
        <div style={styles.layerToggle}>
          <label style={{ fontSize: '0.8rem', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>
            MAP VIEW
          </label>
          <select 
            value={baseLayer} 
            onChange={(e) => setBaseLayer(e.target.value)}
            style={{ padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
          >
            <option value="google_hybrid">Satellite Hybrid</option>
            <option value="google_sat">Satellite Only</option>
            <option value="osm">Standard Map</option>
          </select>
        </div>
      </div>
    </div>
  );
}
