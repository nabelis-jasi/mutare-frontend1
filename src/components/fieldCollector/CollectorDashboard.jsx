import React, { useState, useRef } from 'react';
import MapView from '../MapView';
import FlagFeature from './FlagFeature';
import SyncData from './SyncData';
import CollectorHome from './CollectorHome';
import AvailableForms from './AvailableForms';
import DynamicForm from './DynamicForm';
import NavigationTool from '../NavigationTool'; 
import CollectorProfilePanel from './CollectorProfilePanel';
import CollectorSettingsPanel from './CollectorSettingsPanel';

import './Collector.css';

export default function CollectorDashboard({
  manholes,
  pipes,
  userId,
  role,
  onDataRefresh,
  onLogout,
  userProfile
}) {
  const [activePanel, setActivePanel] = useState(null);
  const [selectedForm, setSelectedForm] = useState(null);
  const [mapInstance, setMapInstance] = useState(null);

  // ── PICK MODE (for forms / flag location picking) ─────────────
  const [pickMode, setPickMode] = useState(false);
  const pickCallbackRef = useRef(null);

  // ── NAVIGATION MODE (for routing) ─────────────────────────────
  const [navPickMode, setNavPickMode] = useState(false);

  const startMapPick = (cb) => {
    pickCallbackRef.current = cb;
    setPickMode(true);
    setActivePanel(null);
  };

  const handleMapClick = (lat, lng) => {
    if (pickCallbackRef.current) {
      pickCallbackRef.current(lat, lng);
      pickCallbackRef.current = null;
      setPickMode(false);
    }
  };

  const cancelMapPick = () => {
    pickCallbackRef.current = null;
    setPickMode(false);
  };

  // Navigation tool handlers
  const handlePickModeChange = (active) => {
    setNavPickMode(active);
  };

  const handleNavMapClick = async (lat, lng) => {
    if (NavigationTool.handleMapClick) {
      await NavigationTool.handleMapClick(lat, lng);
    }
    setNavPickMode(false);
  };

  const handleDataRefreshed = () => {
    onDataRefresh();
  };

  const toggle = (id) => {
    setActivePanel(prev => prev === id ? null : id);
    setSelectedForm(null);
    if (id !== 'nav') setNavPickMode(false); // turn off nav pick mode when switching away
  };

  const handleSelectForm = (form) => {
    setSelectedForm(form);
  };

  const handleFormSubmitted = () => {
    setSelectedForm(null);
    handleDataRefreshed();
  };

  const tools = [
    { id: 'home', icon: '🏠', label: 'Home', color: '#4aad4a' },
    { id: 'nav', icon: '🧭', label: 'NAV', color: '#22d3ee' },      // new navigation tool
    { id: 'forms', icon: '📋', label: 'Forms', color: '#8fdc00' },
    { id: 'flag', icon: '🚩', label: 'Flag', color: '#f59e0b' },
    { id: 'sync', icon: '🔄', label: 'Sync', color: '#22d3ee' },
  ];

  return (
    <div className="wd-root">

      {/* TOP BAR */}
      <header className="wd-topbar">
        <div className="wd-brand">
          <div className="wd-brand-logo">🦺</div>
          <div>
            <div className="wd-brand-name">WWGIS</div>
            <div className="wd-brand-tagline">Field Collector · Wastewater Network</div>
          </div>
        </div>

        <div className="wd-topbar-sep" />

        <div className="wd-chips">
          <div className="wd-chip">
            <span className="dot dot-green" />{manholes?.length ?? 0} Manholes
          </div>
          <div className="wd-chip">
            <span className="dot dot-lime" />{pipes?.length ?? 0} Pipelines
          </div>

          {pickMode && (
            <div className="wd-chip" style={{
              borderColor: 'rgba(143,220,0,0.5)',
              color: '#8fdc00'
            }}>
              <span className="dot dot-lime" /> Pick Mode Active
            </div>
          )}
          {navPickMode && (
            <div className="wd-chip" style={{
              borderColor: 'rgba(143,220,0,0.5)',
              color: '#8fdc00',
              animation: 'pulse-dot 0.8s infinite'
            }}>
              <span className="dot dot-lime" style={{ animationDuration: '0.5s' }} /> Navigation Mode Active
            </div>
          )}
        </div>

        {/* ACTIONS (profile, settings, logout) */}
        <div className="wd-topbar-actions">
          <button
            className={`wd-icon-btn${activePanel === 'profile' ? ' active' : ''}`}
            onClick={() => toggle('profile')}
            title="Profile"
          >👤</button>
          <button
            className={`wd-icon-btn${activePanel === 'settings' ? ' active' : ''}`}
            onClick={() => toggle('settings')}
            title="Settings"
          >⚙️</button>
          <button className="wd-icon-btn" onClick={onLogout} title="Logout">⎋</button>
          <div className="wd-role-pill">{role ?? 'field-collector'}</div>
        </div>
      </header>

      {/* MAP */}
      <div className="wd-map-wrap">
        <MapView
          manholes={manholes}
          pipes={pipes}
          role={role}
          userId={userId}
          onMapReady={setMapInstance}
          navPickMode={pickMode || navPickMode}   // pass true if either mode is active
          onNavMapClick={(lat, lng) => {
            // Route click to appropriate handler based on active mode
            if (pickMode && pickCallbackRef.current) {
              handleMapClick(lat, lng);
            } else if (navPickMode) {
              handleNavMapClick(lat, lng);
            }
          }}
        />
      </div>

      {/* LEFT TOOL RAIL */}
      <nav className="wd-rail">
        {tools.map((t) => (
          <button
            key={t.id}
            className={`wd-rail-btn${activePanel === t.id ? ' active' : ''}`}
            style={{ '--rail-color': t.color }}
            onClick={() => toggle(t.id)}
          >
            <span>{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      {/* PANELS */}

      {activePanel === 'home' && (
        <CollectorHome
          manholes={manholes}
          pipes={pipes}
          onClose={() => setActivePanel(null)}
          onNavigate={toggle}
        />
      )}

      {activePanel === 'nav' && (
        <NavigationTool
          map={mapInstance}
          onClose={() => { setActivePanel(null); setNavPickMode(false); }}
          onPickModeChange={handlePickModeChange}
        />
      )}

      {activePanel === 'forms' && (
        <>
          {!selectedForm ? (
            <AvailableForms
              onSelectForm={handleSelectForm}
              onClose={() => setActivePanel(null)}
            />
          ) : (
            <DynamicForm
              form={selectedForm}
              userId={userId}
              onSubmitted={handleFormSubmitted}
              onCancel={() => setSelectedForm(null)}
              onStartMapPick={startMapPick}
              onCancelMapPick={cancelMapPick}
            />
          )}
        </>
      )}

      {activePanel === 'flag' && (
        <FlagFeature
          userId={userId}
          manholes={manholes}
          pipes={pipes}
          map={mapInstance}
          onFeatureFlagged={handleDataRefreshed}
          onClose={() => setActivePanel(null)}
          onStartMapPick={startMapPick}
        />
      )}

      {activePanel === 'sync' && (
        <SyncData
          userId={userId}
          onSyncComplete={handleDataRefreshed}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'profile' && (
        <CollectorProfilePanel
          userId={userId}
          role={role}
          userProfile={userProfile}
          onLogout={onLogout}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'settings' && (
        <CollectorSettingsPanel
          onClose={() => setActivePanel(null)}
        />
      )}

    </div>
  );
}
