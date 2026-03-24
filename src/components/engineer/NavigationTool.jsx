import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';

// ── OSRM public routing ────────────────────────────────────────────────────
const OSRM = 'https://router.project-osrm.org/route/v1';

const PROFILES = {
  walking: 'foot',
  cycling: 'bike',
  driving: 'car',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const m2h  = (m) => m >= 1000 ? `${(m/1000).toFixed(1)} km` : `${Math.round(m)} m`;
const s2h  = (s) => { const h=Math.floor(s/3600); const m=Math.floor((s%3600)/60); return h>0?`${h}h ${m}m`:`${m} min`; };
const bear = (d) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];

const TURN_ICON = {
  'turn right':'↱','turn left':'↰','slight right':'↗','slight left':'↖',
  'sharp right':'⤴','sharp left':'⤵','uturn':'↩','straight':'↑',
  'roundabout':'⟳','rotary':'⟳','merge':'⇑','fork':'⑂','depart':'◉','arrive':'⚑',
};
const turnIcon = (mod) => {
  if (!mod) return '↑';
  const k = Object.keys(TURN_ICON).find(k => mod.toLowerCase().includes(k));
  return k ? TURN_ICON[k] : '↑';
};

const geocode = async (q) => {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`, { headers: {'Accept-Language':'en'} });
  const d = await r.json();
  if (!d.length) throw new Error(`Cannot find "${q}"`);
  return { lat: +d[0].lat, lng: +d[0].lon, label: d[0].display_name };
};

const revGeo = async (lat, lng) => {
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
  const d = await r.json();
  return (d.display_name || `${lat.toFixed(5)}, ${lng.toFixed(5)}`).split(',').slice(0,2).join(',').trim();
};

// ── Marker factories ───────────────────────────────────────────────────────
const dotIcon = (color, label) => L.divIcon({
  className: '',
  html: `<div style="position:relative;display:inline-flex;align-items:center;justify-content:center">
    <div style="width:18px;height:18px;background:${color};border:2.5px solid #071407;border-radius:50%;box-shadow:0 0 0 3px ${color}55;"></div>
    ${label ? `<span style="position:absolute;left:22px;background:#0a1f0a;border:1px solid ${color};border-radius:3px;padding:1px 5px;font:600 10px/1.4 'JetBrains Mono',monospace;color:${color};white-space:nowrap">${label}</span>` : ''}
  </div>`,
  iconAnchor: [9, 9],
  popupAnchor: [0, -12],
});

// ══════════════════════════════════════════════════════════════════════════
export default function NavigationTool({ map, onClose }) {
  const [mode,         setMode]     = useState('walking');
  const [waypoints,    setWaypoints]= useState([{ text: '', coords: null }, { text: '', coords: null }]);
  const [useGPS,       setUseGPS]   = useState(false);
  const [locating,     setLocating] = useState(false);
  const [loading,      setLoading]  = useState(false);
  const [error,        setError]    = useState('');
  const [route,        setRoute]    = useState(null);
  const [steps,        setSteps]    = useState([]);
  const [activeStep,   setActiveStep]= useState(0);

  const routeLayer = useRef(null);
  const markers    = useRef([]);

  useEffect(() => () => clearLayers(), []);

  const clearLayers = () => {
    if (!map) return;
    if (routeLayer.current) { map.removeLayer(routeLayer.current); routeLayer.current = null; }
    markers.current.forEach(m => map.removeLayer(m));
    markers.current = [];
  };

  // ── Waypoint helpers ─────────────────────────────────────────────────────
  const updateWP = (i, patch) =>
    setWaypoints(ws => ws.map((w, idx) => idx === i ? { ...w, ...patch } : w));

  const addWaypoint = () =>
    setWaypoints(ws => [...ws, { text: '', coords: null }]);

  const removeWaypoint = (i) =>
    setWaypoints(ws => ws.filter((_, idx) => idx !== i));

  // ── GPS for origin ───────────────────────────────────────────────────────
  const getGPS = () => {
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        const text = await revGeo(lat, lng).catch(() => `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
        updateWP(0, { text, coords: { lat, lng } });
        setLocating(false);
      },
      () => { setError('GPS denied — type your start address instead.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 9000 }
    );
  };

  // ── Pick on map ──────────────────────────────────────────────────────────
  const pickOnMap = (i) => {
    if (!map) return;
    setError(`Click the map to set waypoint ${i + 1}…`);
    map.once('click', async ({ latlng: { lat, lng } }) => {
      const text = await revGeo(lat, lng).catch(() => `${lat.toFixed(5)}, ${lng.toFixed(5)}`);
      updateWP(i, { text, coords: { lat, lng } });
      setError('');
    });
  };

  // ── Route calculation ────────────────────────────────────────────────────
  const fetchRoute = async () => {
    setLoading(true); setError(''); setRoute(null); setSteps([]); setActiveStep(0);
    try {
      // Resolve all waypoint coords
      const resolved = await Promise.all(
        waypoints.map(wp => wp.coords ? wp.coords : geocode(wp.text))
      );

      // Build OSRM waypoint string: lng,lat;lng,lat;...
      const wStr = resolved.map(r => `${r.lng},${r.lat}`).join(';');
      const profile = PROFILES[mode];
      const url = `${OSRM}/route/v1/${profile}/${wStr}?steps=true&geometries=geojson&overview=full`;

      const res  = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes.length) throw new Error('No route found.');

      const r = data.routes[0];
      setRoute({ distance: r.distance, duration: r.duration });

      // All steps across all legs
      const allSteps = r.legs.flatMap(leg =>
        leg.steps.map(s => ({
          modifier: `${s.maneuver.type} ${s.maneuver.modifier || ''}`.trim(),
          name:     s.name || '',
          distance: s.distance,
          duration: s.duration,
          bearing:  s.maneuver.bearing_after,
        }))
      );
      setSteps(allSteps);

      // Draw on map
      clearLayers();
      const coords = r.geometry.coordinates.map(([lg, la]) => [la, lg]);

      routeLayer.current = L.polyline(coords, {
        color: '#8fdc00', weight: 5, opacity: 0.9, lineJoin: 'round',
      }).addTo(map);

      // Waypoint markers
      const colors = ['#4aad4a', '#22d3ee', '#f59e0b', '#ef4444', '#a78bfa'];
      resolved.forEach((r, i) => {
        const isLast  = i === resolved.length - 1;
        const color   = isLast ? '#ef4444' : colors[i % colors.length];
        const label   = i === 0 ? 'Start' : isLast ? 'End' : `WP${i}`;
        const mk = L.marker([r.lat, r.lng], { icon: dotIcon(color, label) }).addTo(map);
        markers.current.push(mk);
      });

      map.fitBounds(routeLayer.current.getBounds(), { padding: [48, 48] });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearRoute = () => {
    clearLayers();
    setRoute(null); setSteps([]); setActiveStep(0);
    setWaypoints([{ text: '', coords: null }, { text: '', coords: null }]);
    setError('');
  };

  const cur   = steps[activeStep];
  const ready = waypoints.length >= 2 && waypoints.every(w => w.text || w.coords);

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(34,211,238,0.08)', '--panel-icon-border': 'rgba(34,211,238,0.3)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">🧭</div>
        <div>
          <div className="wd-panel-title">GPS Navigation</div>
          <div className="wd-panel-sub">Multi-waypoint · OSRM Turn-by-Turn</div>
        </div>
        <button className="wd-panel-close" onClick={() => { clearRoute(); onClose(); }}>×</button>
      </div>

      <div className="wd-panel-body">

        {/* Travel mode */}
        <div className="wd-mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 14 }}>
          {[['walking','🚶','Walk'],['cycling','🚴','Cycle'],['driving','🚗','Drive']].map(([id, icon, lbl]) => (
            <div key={id} className={`wd-mode-tile${mode===id?' active':''}`} onClick={() => setMode(id)} style={{ justifyContent: 'center' }}>
              <span>{icon}</span> {lbl}
            </div>
          ))}
        </div>

        {/* Waypoints */}
        <div className="wd-section">Waypoints</div>
        {waypoints.map((wp, i) => (
          <div key={i} className="wd-waypoint" style={{ marginBottom: 6 }}>
            <div className="wp-num">{i + 1}</div>
            <input
              className="wd-input"
              style={{ flex: 1, padding: '6px 10px', fontSize: 12 }}
              placeholder={i === 0 ? 'Start location…' : i === waypoints.length - 1 ? 'Destination…' : `Waypoint ${i + 1}…`}
              value={wp.text}
              onChange={e => updateWP(i, { text: e.target.value, coords: null })}
            />
            {/* GPS button only for first waypoint */}
            {i === 0 && (
              <button className="wd-btn wd-btn-ghost" style={{ padding: '6px 10px', flexShrink: 0 }}
                onClick={getGPS} disabled={locating} title="Use GPS">
                {locating ? '⏳' : '📍'}
              </button>
            )}
            {/* Pick on map */}
            <button className="wd-btn wd-btn-ghost" style={{ padding: '6px 10px', flexShrink: 0 }}
              onClick={() => pickOnMap(i)} title="Pick on map">🗺️</button>
            {/* Remove (only if > 2 waypoints and not first/last) */}
            {waypoints.length > 2 && i > 0 && i < waypoints.length - 1 && (
              <button className="wp-del" onClick={() => removeWaypoint(i)}>×</button>
            )}
          </div>
        ))}

        {/* Add waypoint */}
        <button
          className="wd-btn wd-btn-ghost"
          style={{ width: '100%', marginBottom: 14 }}
          onClick={addWaypoint}
        >
          + Add Stop
        </button>

        {/* Error */}
        {error && <div className="wd-status err">{error}</div>}

        {/* Route summary */}
        {route && (
          <div className="wd-stats" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 14 }}>
            <div className="wd-stat lime">
              <div className="s-num" style={{ fontSize: 16 }}>{m2h(route.distance)}</div>
              <div className="s-lbl">Distance</div>
            </div>
            <div className="wd-stat green">
              <div className="s-num" style={{ fontSize: 16 }}>{s2h(route.duration)}</div>
              <div className="s-lbl">Est. Time</div>
            </div>
          </div>
        )}

        {/* Active step */}
        {cur && (
          <div className="wd-nav-step">
            <div className="wd-nav-arrow">{turnIcon(cur.modifier)}</div>
            <div className="wd-nav-instruction">{cur.modifier}{cur.name ? ` onto ${cur.name}` : ''}</div>
            <div className="wd-nav-meta">
              {m2h(cur.distance)} · {s2h(cur.duration)}
              {cur.bearing != null ? ` · Head ${bear(cur.bearing)}` : ''}
            </div>
            <div className="wd-nav-controls">
              <button className="wd-btn wd-btn-ghost" style={{ padding: '5px 12px' }}
                onClick={() => setActiveStep(s => Math.max(0, s-1))} disabled={activeStep === 0}>← Prev</button>
              <span className="wd-nav-counter">Step {activeStep+1} / {steps.length}</span>
              <button className="wd-btn wd-btn-primary" style={{ padding: '5px 12px' }}
                onClick={() => setActiveStep(s => Math.min(steps.length-1, s+1))} disabled={activeStep === steps.length-1}>Next →</button>
            </div>
          </div>
        )}

        {/* Steps list */}
        {steps.length > 0 && (
          <>
            <div className="wd-section">All Steps</div>
            {steps.map((step, i) => (
              <div key={i} className={`wd-step-item${activeStep===i?' active':''}`} onClick={() => setActiveStep(i)}>
                <span className="wd-step-icon">{turnIcon(step.modifier)}</span>
                <div className="wd-step-text">
                  <div className="wd-step-name">{step.modifier}{step.name ? ` onto ${step.name}` : ''}</div>
                  <div className="wd-step-dist">{m2h(step.distance)} · {s2h(step.duration)}</div>
                </div>
                <span className="wd-step-num">#{i+1}</span>
              </div>
            ))}
          </>
        )}

        {/* Actions */}
        <div className="wd-btn-row">
          {route
            ? <>
                <button className="wd-btn wd-btn-ghost" onClick={clearRoute}>🗑 Clear</button>
                <button className="wd-btn wd-btn-lime"  onClick={fetchRoute} disabled={loading}>↺ Re-route</button>
              </>
            : <>
                <button className="wd-btn wd-btn-ghost" onClick={clearRoute}>Clear</button>
                <button className="wd-btn wd-btn-primary" style={{ flex: 2 }} onClick={fetchRoute}
                  disabled={loading || !ready}>
                  {loading ? '⏳ Routing…' : '🧭 Get Directions'}
                </button>
              </>
          }
        </div>
      </div>
    </div>
  );
}