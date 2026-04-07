import React, { useState, useRef, useEffect } from 'react';
import L from 'leaflet';

// ── OSRM ──────────────────────────────────────────────────────────────────
const OSRM = 'https://router.project-osrm.org/route/v1';
const PROFILES = { walking: 'foot', cycling: 'bike', driving: 'car' };

// ── Formatters ────────────────────────────────────────────────────────────
const m2h  = (m) => m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
const s2h  = (s) => { const h = Math.floor(s / 3600), mn = Math.floor((s % 3600) / 60); return h > 0 ? `${h}h ${mn}m` : `${mn} min`; };
const bear = (d) => ['N','NE','E','SE','S','SW','W','NW'][Math.round(d / 45) % 8];
const coord = (lat, lng) => `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

// ── Turn icons ────────────────────────────────────────────────────────────
const TURNS = {
  'turn right':'↱','turn left':'↰','slight right':'↗','slight left':'↖',
  'sharp right':'⤴','sharp left':'⤵','uturn':'↩','straight':'↑',
  'roundabout':'⟳','rotary':'⟳','merge':'⇑','fork':'⑂','depart':'◉','arrive':'⚑',
};
const tIcon = (mod) => {
  if (!mod) return '↑';
  const k = Object.keys(TURNS).find(k => mod.toLowerCase().includes(k));
  return k ? TURNS[k] : '↑';
};

// ── Geocoding ─────────────────────────────────────────────────────────────
const geocode = async (q) => {
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`,
    { headers: { 'Accept-Language': 'en' } }
  );
  const d = await r.json();
  if (!d.length) throw new Error(`Cannot find "${q}"`);
  return { lat: +d[0].lat, lng: +d[0].lon, label: d[0].display_name };
};

const revGeo = async (lat, lng) => {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
    const d = await r.json();
    return (d.display_name || '').split(',').slice(0, 3).join(',').trim();
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
};

// ── Waypoint pin icons ─────────────────────────────────────────────────────
const WP_COLORS = ['#4aad4a', '#22d3ee', '#f59e0b', '#a78bfa', '#f472b6', '#fb923c'];

const pinIcon = (color, label, isEnd = false) => L.divIcon({
  className: '',
  html: `
    <div style="position:relative;display:flex;flex-direction:column;align-items:center">
      <div style="
        width:28px;height:28px;
        background:${color};
        border:3px solid white;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        box-shadow:0 3px 12px rgba(0,0,0,0.4);
        display:flex;align-items:center;justify-content:center;
      ">
        <span style="transform:rotate(45deg);font-size:11px;font-weight:800;color:white;
                     font-family:'JetBrains Mono',monospace">
          ${isEnd ? '⚑' : label}
        </span>
      </div>
      <div style="
        position:absolute;top:32px;left:50%;transform:translateX(-50%);
        background:#071407;border:1px solid ${color};border-radius:4px;
        padding:2px 6px;font:700 9px/1.4 'JetBrains Mono',monospace;
        color:${color};white-space:nowrap;pointer-events:none;
      ">${isEnd ? 'END' : label === '1' ? 'START' : `STOP ${label}`}</div>
    </div>
  `,
  iconSize:    [28, 40],
  iconAnchor:  [14, 28],
  popupAnchor: [0, -32],
});

// ── Route line colours (one per leg) ──────────────────────────────────────
const LEG_COLORS = ['#8fdc00', '#22d3ee', '#f59e0b', '#a78bfa', '#f472b6'];

// ═════════════════════════════════════════════════════════════════════════
export default function NavigationTool({ map, onClose, onPickModeChange }) {
  const [mode,       setMode]      = useState('walking');
  const [waypoints,  setWPs]       = useState([
    { text: '', coords: null },
    { text: '', coords: null },
  ]);
  const [pickingIdx, setPickingIdx] = useState(null); // which WP is being picked
  const [locating,   setLocating]  = useState(false);
  const [loading,    setLoading]   = useState(false);
  const [error,      setError]     = useState('');
  const [route,      setRoute]     = useState(null);   // { totalDist, totalDur, legs[] }
  const [steps,      setSteps]     = useState([]);     // flat array for step navigator
  const [activeStep, setStep]      = useState(0);
  const [view,       setView]      = useState('plan'); // 'plan' | 'turn' | 'summary'

  const routeLayers = useRef([]);
  const markerLayers = useRef([]);

  // ── Cleanup on unmount ────────────────────────────────────────────────
  useEffect(() => () => { clearMapLayers(); onPickModeChange?.(false, null); }, []);

  const clearMapLayers = () => {
    if (!map) return;
    routeLayers.current.forEach(l => map.removeLayer(l));
    markerLayers.current.forEach(l => map.removeLayer(l));
    routeLayers.current  = [];
    markerLayers.current = [];
  };

  // ── Notify parent of pick mode changes ───────────────────────────────
  useEffect(() => {
    onPickModeChange?.(pickingIdx !== null, pickingIdx);
  }, [pickingIdx]);

  // ── Called by MapView when user clicks map in pick mode ───────────────
  // (Wired via EngineerDashboard → MapView prop navPickMode + onNavMapClick)
  // We also expose this method so parent can call it
  NavigationTool.handleMapClick = async (lat, lng) => {
    if (pickingIdx === null) return;
    const text = await revGeo(lat, lng);
    setWPs(ws => ws.map((w, i) => i === pickingIdx ? { text, coords: { lat, lng } } : w));
    setPickingIdx(null);
    setError('');
  };

  // ── Waypoint helpers ──────────────────────────────────────────────────
  const updateWP = (i, patch) => setWPs(ws => ws.map((w, idx) => idx === i ? { ...w, ...patch } : w));
  const addWP    = ()         => setWPs(ws => [...ws, { text: '', coords: null }]);
  const removeWP = (i)        => setWPs(ws => ws.length > 2 ? ws.filter((_, idx) => idx !== i) : ws);

  // ── GPS ───────────────────────────────────────────────────────────────
  const getGPS = () => {
    setLocating(true); setError('');
    navigator.geolocation.getCurrentPosition(
      async ({ coords: { latitude: lat, longitude: lng } }) => {
        const text = await revGeo(lat, lng);
        updateWP(0, { text, coords: { lat, lng } });
        setLocating(false);
      },
      () => { setError('GPS denied. Type an address or click the map.'); setLocating(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // ── Start map-pick for waypoint i ────────────────────────────────────
  const startPick = (i) => {
    setPickingIdx(i);
    setError('');
  };

  const cancelPick = () => {
    setPickingIdx(null);
    setError('');
    onPickModeChange?.(false, null);
  };

  // ── Route calculation ─────────────────────────────────────────────────
  const fetchRoute = async () => {
    setLoading(true); setError(''); setRoute(null); setSteps([]); setStep(0);
    try {
      // Resolve all coords
      const resolved = await Promise.all(
        waypoints.map(wp => wp.coords ? Promise.resolve(wp.coords) : geocode(wp.text))
      );
      // Store resolved text back
      setWPs(ws => ws.map((w, i) => ({
        ...w,
        coords: resolved[i],
        text:   w.text || coord(resolved[i].lat, resolved[i].lng),
      })));

      const wStr    = resolved.map(r => `${r.lng},${r.lat}`).join(';');
      const profile = PROFILES[mode];
      const url     = `${OSRM}/route/v1/${profile}/${wStr}?steps=true&geometries=geojson&overview=full&annotations=false`;

      const res  = await fetch(url);
      const data = await res.json();
      if (data.code !== 'Ok' || !data.routes.length) throw new Error('No route found between these points.');

      const r = data.routes[0];

      // Per-leg data
      const legs = r.legs.map((leg, i) => ({
        from:     resolved[i],
        to:       resolved[i + 1],
        distance: leg.distance,
        duration: leg.duration,
        steps:    leg.steps.map(s => ({
          modifier: `${s.maneuver.type} ${s.maneuver.modifier || ''}`.trim(),
          name:     s.name || '',
          distance: s.distance,
          duration: s.duration,
          bearing:  s.maneuver.bearing_after,
          coords:   s.maneuver.location ? [s.maneuver.location[1], s.maneuver.location[0]] : null,
        })),
      }));

      const allSteps = legs.flatMap(l => l.steps);

      setRoute({
        totalDist: r.distance,
        totalDur:  r.duration,
        legs,
      });
      setSteps(allSteps);
      setView('summary');

      // ── Draw on map ──────────────────────────────────────────────────
      clearMapLayers();

      // Draw each leg with its own colour
      r.legs.forEach((leg, i) => {
        const legCoords = leg.steps.flatMap(s =>
          (s.geometry?.coordinates || []).map(([ln, la]) => [la, ln])
        );
        // Fallback: use full route geometry for first leg if step geometry missing
        const drawCoords = legCoords.length > 1
          ? legCoords
          : r.geometry.coordinates.map(([ln, la]) => [la, ln]);

        if (drawCoords.length > 1) {
          const pl = L.polyline(drawCoords, {
            color:   LEG_COLORS[i % LEG_COLORS.length],
            weight:  6,
            opacity: 0.88,
            lineJoin: 'round',
          }).addTo(map);
          routeLayers.current.push(pl);
        }
      });

      // Fallback: draw full route if leg segmentation failed
      if (routeLayers.current.length === 0) {
        const coords = r.geometry.coordinates.map(([ln, la]) => [la, ln]);
        const pl = L.polyline(coords, { color: '#8fdc00', weight: 6, opacity: 0.9, lineJoin: 'round' }).addTo(map);
        routeLayers.current.push(pl);
      }

      // Waypoint markers
      resolved.forEach((pt, i) => {
        const isLast = i === resolved.length - 1;
        const color  = isLast ? '#ef4444' : WP_COLORS[i % WP_COLORS.length];
        const mk = L.marker([pt.lat, pt.lng], { icon: pinIcon(color, String(i + 1), isLast) }).addTo(map);
        markerLayers.current.push(mk);
      });

      // Fit map
      if (routeLayers.current.length > 0) {
        const group = L.featureGroup(routeLayers.current);
        map.fitBounds(group.getBounds(), { padding: [52, 52] });
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const clearAll = () => {
    clearMapLayers();
    setRoute(null); setSteps([]); setStep(0);
    setWPs([{ text: '', coords: null }, { text: '', coords: null }]);
    setError(''); setView('plan');
    setPickingIdx(null);
    onPickModeChange?.(false, null);
  };

  const cur   = steps[activeStep];
  const ready = waypoints.length >= 2 && waypoints.every(w => w.text || w.coords);

  // ── RENDER ────────────────────────────────────────────────────────────
  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(34,211,238,0.08)', '--panel-icon-border': 'rgba(34,211,238,0.3)' }}>

      {/* Header */}
      <div className="wd-panel-header">
        <div className="wd-panel-icon">🧭</div>
        <div>
          <div className="wd-panel-title">Navigation</div>
          <div className="wd-panel-sub">GPS · Multi-Stop · Turn-by-Turn</div>
        </div>
        {route && (
          <div style={{ display: 'flex', gap: 4, marginLeft: 'auto', marginRight: 8 }}>
            {['plan','summary','turn'].map(v => (
              <button key={v} onClick={() => setView(v)}
                style={{
                  padding: '3px 8px',
                  borderRadius: 5,
                  border: '1px solid',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                  fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  borderColor: view === v ? 'var(--accent-lime)' : 'var(--border)',
                  background:  view === v ? 'var(--glow-lime)'   : 'transparent',
                  color:       view === v ? 'var(--accent-lime)'  : 'var(--text-sec)',
                }}>
                {v === 'plan' ? '📍' : v === 'summary' ? '📋' : '🔄'}
              </button>
            ))}
          </div>
        )}
        <button className="wd-panel-close" onClick={() => { clearAll(); onClose(); }}>×</button>
      </div>

      <div className="wd-panel-body">

        {/* ── PICK MODE BANNER ── */}
        {pickingIdx !== null && (
          <div style={{
            background: 'rgba(143,220,0,0.08)',
            border: '1px solid rgba(143,220,0,0.4)',
            borderRadius: 'var(--r-md)',
            padding: '10px 14px',
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}>
            <span style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, color: 'var(--accent-lime)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              📍 Click map to set {pickingIdx === 0 ? 'Start' : pickingIdx === waypoints.length - 1 ? 'Destination' : `Stop ${pickingIdx + 1}`}
            </span>
            <button className="wd-btn wd-btn-ghost" style={{ padding: '4px 10px', fontSize: 11 }} onClick={cancelPick}>
              Cancel
            </button>
          </div>
        )}

        {/* ── PLANNING VIEW ── */}
        {view === 'plan' && (
          <>
            {/* Travel mode */}
            <div className="wd-mode-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr', marginBottom: 14 }}>
              {[['walking','🚶','Walk'],['cycling','🚴','Cycle'],['driving','🚗','Drive']].map(([id, icon, lbl]) => (
                <div key={id} className={`wd-mode-tile${mode === id ? ' active' : ''}`}
                  onClick={() => setMode(id)} style={{ justifyContent: 'center' }}>
                  <span>{icon}</span> {lbl}
                </div>
              ))}
            </div>

            <div className="wd-section">Waypoints</div>

            {waypoints.map((wp, i) => {
              const isFirst = i === 0;
              const isLast  = i === waypoints.length - 1;
              const label   = isFirst ? 'Start' : isLast ? 'Destination' : `Stop ${i + 1}`;
              const color   = isLast ? '#ef4444' : WP_COLORS[i % WP_COLORS.length];
              const isPicking = pickingIdx === i;

              return (
                <div key={i} style={{ marginBottom: 8 }}>
                  {/* Label row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 0 2px ${color}44` }} />
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-sec)' }}>
                      {label}
                    </span>
                    {wp.coords && (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--accent-lime)', marginLeft: 'auto' }}>
                        ✓ set
                      </span>
                    )}
                  </div>

                  {/* Input row */}
                  <div style={{ display: 'flex', gap: 5 }}>
                    <input
                      className="wd-input"
                      style={{ flex: 1, padding: '7px 10px', fontSize: 12, borderColor: isPicking ? 'var(--accent-lime)' : undefined }}
                      placeholder={isFirst ? 'Address or click 📍 on map…' : isLast ? 'Destination address…' : `Stop ${i + 1} address…`}
                      value={wp.text}
                      onChange={e => updateWP(i, { text: e.target.value, coords: null })}
                    />

                    {/* GPS button — first waypoint only */}
                    {isFirst && (
                      <button className="wd-btn wd-btn-ghost" style={{ padding: '0 9px', flexShrink: 0 }}
                        onClick={getGPS} disabled={locating} title="Use my GPS location">
                        {locating ? '⏳' : '📍'}
                      </button>
                    )}

                    {/* Map pick button */}
                    <button
                      className={`wd-btn ${isPicking ? 'wd-btn-lime' : 'wd-btn-ghost'}`}
                      style={{ padding: '0 9px', flexShrink: 0 }}
                      onClick={() => isPicking ? cancelPick() : startPick(i)}
                      title="Click map to pick this point"
                    >
                      🗺️
                    </button>

                    {/* Remove stop — only intermediate waypoints */}
                    {waypoints.length > 2 && !isFirst && !isLast && (
                      <button className="wd-btn wd-btn-ghost"
                        style={{ padding: '0 8px', flexShrink: 0, color: 'var(--accent-red)' }}
                        onClick={() => removeWP(i)}>
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add stop */}
            <button
              className="wd-btn wd-btn-ghost"
              style={{ width: '100%', marginTop: 4, marginBottom: 14, fontSize: 12 }}
              onClick={addWP}
            >
              + Add Stop
            </button>

            {/* Error */}
            {error && <div className="wd-status err" style={{ marginBottom: 10 }}>{error}</div>}

            {/* Actions */}
            <div className="wd-btn-row">
              <button className="wd-btn wd-btn-ghost" onClick={clearAll}>Clear</button>
              <button className="wd-btn wd-btn-primary" style={{ flex: 2 }}
                onClick={fetchRoute} disabled={loading || !ready}>
                {loading ? '⏳ Routing…' : '🧭 Get Directions'}
              </button>
            </div>

            {/* Helper tips */}
            <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: 'var(--r-md)' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 6 }}>
                How to use
              </div>
              {[
                ['📍', 'GPS button sets your exact current location'],
                ['🗺️', 'Map picker — click anywhere on the map'],
                ['⌨️', 'Type any address and press Get Directions'],
                ['+',  'Add multiple stops for multi-destination routes'],
              ].map(([icon, tip]) => (
                <div key={tip} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <span style={{ width: 16, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-sec)' }}>{tip}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── SUMMARY VIEW ── */}
        {view === 'summary' && route && (
          <>
            {/* Total stats */}
            <div className="wd-stats" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: 16 }}>
              <div className="wd-stat lime">
                <div className="s-num" style={{ fontSize: 18 }}>{m2h(route.totalDist)}</div>
                <div className="s-lbl">Total Distance</div>
              </div>
              <div className="wd-stat green">
                <div className="s-num" style={{ fontSize: 18 }}>{s2h(route.totalDur)}</div>
                <div className="s-lbl">Est. Time</div>
              </div>
            </div>

            {/* Mode + stops */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-sec)' }}>
                {mode === 'walking' ? '🚶 Walking' : mode === 'cycling' ? '🚴 Cycling' : '🚗 Driving'}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>·</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-sec)' }}>
                {waypoints.length} stops · {route.legs.length} leg{route.legs.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Per-leg cards */}
            <div className="wd-section">Route Legs</div>
            {route.legs.map((leg, i) => (
              <div key={i} style={{
                background: 'var(--bg-raised)',
                border: `1px solid ${LEG_COLORS[i % LEG_COLORS.length]}55`,
                borderLeft: `3px solid ${LEG_COLORS[i % LEG_COLORS.length]}`,
                borderRadius: 'var(--r-md)',
                padding: '10px 12px',
                marginBottom: 8,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--text-pri)' }}>
                    Leg {i + 1} — Stop {i + 1} → Stop {i + 2}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: LEG_COLORS[i % LEG_COLORS.length], fontWeight: 600 }}>
                    {m2h(leg.distance)}
                  </div>
                </div>
                <div className="wd-info-row" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="ir-k">Distance</span>
                  <span className="ir-v">{m2h(leg.distance)}</span>
                </div>
                <div className="wd-info-row" style={{ padding: '4px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="ir-k">Duration</span>
                  <span className="ir-v">{s2h(leg.duration)}</span>
                </div>
                <div className="wd-info-row" style={{ padding: '4px 0' }}>
                  <span className="ir-k">Steps</span>
                  <span className="ir-v">{leg.steps.length}</span>
                </div>
              </div>
            ))}

            {/* Route waypoint list */}
            <div className="wd-section">Stops</div>
            {waypoints.map((wp, i) => {
              const isLast = i === waypoints.length - 1;
              const color  = isLast ? '#ef4444' : WP_COLORS[i % WP_COLORS.length];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: color, border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'white', flexShrink: 0, marginTop: 1 }}>
                    {i === 0 ? 'S' : isLast ? 'E' : i}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 2 }}>
                      {i === 0 ? 'Start' : isLast ? 'End' : `Stop ${i + 1}`}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-pri)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {wp.text || (wp.coords ? coord(wp.coords.lat, wp.coords.lng) : '—')}
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="wd-btn-row" style={{ marginTop: 14 }}>
              <button className="wd-btn wd-btn-ghost"  onClick={clearAll}>🗑 Clear</button>
              <button className="wd-btn wd-btn-ghost"  onClick={() => setView('plan')}>✏️ Edit</button>
              <button className="wd-btn wd-btn-lime"   onClick={() => setView('turn')}>▶ Navigate</button>
            </div>
          </>
        )}

        {/* ── TURN-BY-TURN VIEW ── */}
        {view === 'turn' && route && (
          <>
            {/* Active step card */}
            {cur && (
              <div className="wd-nav-step">
                <div className="wd-nav-arrow">{tIcon(cur.modifier)}</div>
                <div className="wd-nav-instruction">
                  {cur.modifier}{cur.name ? ` onto ${cur.name}` : ''}
                </div>
                <div className="wd-nav-meta">
                  {m2h(cur.distance)} · {s2h(cur.duration)}
                  {cur.bearing != null ? ` · Head ${bear(cur.bearing)}` : ''}
                </div>
                <div className="wd-nav-controls">
                  <button className="wd-btn wd-btn-ghost" style={{ padding: '5px 12px' }}
                    onClick={() => setStep(s => Math.max(0, s - 1))} disabled={activeStep === 0}>
                    ← Prev
                  </button>
                  <span className="wd-nav-counter">Step {activeStep + 1} / {steps.length}</span>
                  <button className="wd-btn wd-btn-primary" style={{ padding: '5px 12px' }}
                    onClick={() => setStep(s => Math.min(steps.length - 1, s + 1))} disabled={activeStep === steps.length - 1}>
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Progress bar */}
            <div className="wd-progress-track" style={{ marginBottom: 12 }}>
              <div className="wd-progress-fill" style={{ width: `${((activeStep + 1) / steps.length) * 100}%` }} />
            </div>

            {/* All steps */}
            <div className="wd-section">All Steps ({steps.length})</div>
            <div style={{ maxHeight: 320, overflowY: 'auto' }}>
              {steps.map((step, i) => (
                <div key={i} className={`wd-step-item${activeStep === i ? ' active' : ''}`}
                  onClick={() => setStep(i)}>
                  <span className="wd-step-icon">{tIcon(step.modifier)}</span>
                  <div className="wd-step-text">
                    <div className="wd-step-name" style={{ textTransform: 'capitalize' }}>
                      {step.modifier}{step.name ? ` onto ${step.name}` : ''}
                    </div>
                    <div className="wd-step-dist">{m2h(step.distance)} · {s2h(step.duration)}</div>
                  </div>
                  <span className="wd-step-num">#{i + 1}</span>
                </div>
              ))}
            </div>

            <div className="wd-btn-row" style={{ marginTop: 14 }}>
              <button className="wd-btn wd-btn-ghost" onClick={clearAll}>🗑 Clear</button>
              <button className="wd-btn wd-btn-ghost" onClick={() => setView('summary')}>📋 Summary</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
