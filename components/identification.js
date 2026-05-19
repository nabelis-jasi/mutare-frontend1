// components/identification.js - Map Identification Tool
// Now works with backend data (manholes, pipelines, suburbs arrays)

import MapView from './mapview.js';  // needed for map instance

let identificationMode = false;
let currentIdentifiedData = null;
let currentIdentifiedFeatures = [];

// Data arrays (to be set from main.js after API fetch)
let manholesData = [];
let pipelinesData = [];
let suburbsData = [];

// Map instance
let map = null;

// Helper: distance between two points (Haversine, returns metres)
function distance(lat1, lng1, lat2, lng2) {
    const R = 6371000; // metres
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Distance from point to line segment (lat/lon) – returns metres
function distanceToSegment(pointLat, pointLng, lat1, lng1, lat2, lng2) {
    const x0 = pointLng, y0 = pointLat;
    const x1 = lng1, y1 = lat1;
    const x2 = lng2, y2 = lat2;
    const A = x0 - x1;
    const B = y0 - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const len2 = C * C + D * D;
    let param = -1;
    if (len2 !== 0) param = dot / len2;
    let xx, yy;
    if (param < 0) { xx = x1; yy = y1; }
    else if (param > 1) { xx = x2; yy = y2; }
    else { xx = x1 + param * C; yy = y1 + param * D; }
    const dx = x0 - xx;
    const dy = y0 - yy;
    const distanceMeters = Math.sqrt(dx*dx + dy*dy) * 111319;
    return distanceMeters;
}

// Point-in-polygon (ray casting)
function pointInPolygon(lat, lng, polygonCoords) {
    let inside = false;
    for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
        const xi = polygonCoords[i][1], yi = polygonCoords[i][0];
        const xj = polygonCoords[j][1], yj = polygonCoords[j][0];
        const intersect = ((yi > lat) != (yj > lat)) &&
            (lng < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

// Find features near click (within tolerance metres)
function identifyFeatures(lat, lng, toleranceM = 50) {
    const identified = [];

    // Manholes (points) - using the flat array from /api/manholes/list
    for (const m of manholesData) {
        if (m.lat && m.lng) {
            const d = distance(lat, lng, m.lat, m.lng);
            if (d <= toleranceM) {
                identified.push({ 
                    type: 'manhole', 
                    ...m, 
                    distance: Math.round(d),
                    name: m.name || m.manhole_id
                });
            }
        }
    }

    // Pipelines (lines) - using the GeoJSON format
    for (const p of pipelinesData) {
        let coords = null;
        // Handle both GeoJSON and simple array formats
        if (p.geometry && p.geometry.type === 'LineString') {
            coords = p.geometry.coordinates;
        } else if (p.coordinates && p.coordinates.length >= 2) {
            coords = p.coordinates.map(c => [c[1], c[0]]); // convert [lat,lng] to [lng,lat]
        }
        
        if (coords && coords.length >= 2) {
            let minDist = Infinity;
            for (let i = 0; i < coords.length - 1; i++) {
                const segDist = distanceToSegment(lat, lng, coords[i][1], coords[i][0], coords[i+1][1], coords[i+1][0]);
                if (segDist < minDist) minDist = segDist;
            }
            if (minDist <= toleranceM) {
                identified.push({ 
                    type: 'pipeline', 
                    name: p.pipe_id || p.name,
                    status: p.block_stat || p.status,
                    material: p.pipe_mat || p.material,
                    diameter: p.pipe_size || p.diameter,
                    length: p.length,
                    distance: Math.round(minDist)
                });
            }
        }
    }

    // Suburbs (polygons) - using GeoJSON format
    for (const s of suburbsData) {
        let geometry = s.geometry;
        if (geometry && (geometry.type === 'Polygon' || geometry.type === 'MultiPolygon')) {
            let inside = false;
            if (geometry.type === 'Polygon') {
                inside = pointInPolygon(lat, lng, geometry.coordinates[0]);
            } else if (geometry.type === 'MultiPolygon') {
                for (const poly of geometry.coordinates) {
                    if (pointInPolygon(lat, lng, poly[0])) { inside = true; break; }
                }
            }
            if (inside) {
                identified.push({ 
                    type: 'suburb', 
                    name: s.suburb_nam || s.name,
                    township: s.township,
                    ward: s.ward,
                    op_zone: s.op_zone,
                    short_name: s.short_name,
                    distance: 0
                });
            }
        }
    }

    return identified;
}

// Render HTML
function render() {
    return `
        <div class="identification-tool-container">
            <div class="identification-header">
                <h4>🔍 IDENTIFICATION TOOL</h4>
                <button id="toggleIdentificationBtn" class="identify-btn">
                    <span class="btn-icon">🎯</span> Activate
                </button>
            </div>
            <div class="identification-status" id="identificationStatus">
                <span class="status-dot"></span>
                <span class="status-text">Click button to activate</span>
            </div>
            <div id="identifyResultPanel" class="identify-result-panel" style="display: none;">
                <div class="identify-result-header">
                    <h5>📋 Identified Features</h5>
                    <button id="closeIdentifyPanel" class="close-identify-btn">&times;</button>
                </div>
                <div id="identifyFeatureList" class="identify-feature-list"></div>
                <div class="identify-export-buttons">
                    <button id="exportIdentifiedCSV" class="export-identify-btn csv-btn" title="Export as CSV">📎 CSV</button>
                    <button id="exportIdentifiedJSON" class="export-identify-btn json-btn" title="Export as JSON">🔗 JSON</button>
                    <button id="exportIdentifiedPDF" class="export-identify-btn pdf-btn" title="Export as PDF">📊 PDF</button>
                    <button id="exportIdentifiedSHP" class="export-identify-btn shp-btn" title="Export as Shapefile">🗺️ SHP</button>
                    <button id="saveIdentification" class="export-identify-btn save-btn" title="Save Session">💾 Save</button>
                </div>
            </div>
        </div>
    `;
}

// Initialize tool with map reference (called after map is ready)
function initIdentificationTool(mapInstance) {
    map = mapInstance;
    const toggleBtn = document.getElementById('toggleIdentificationBtn');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', () => {
        identificationMode = !identificationMode;
        if (!map) {
            console.error('Map not available for identification');
            return;
        }
        const mapContainer = map.getContainer();
        if (identificationMode) {
            toggleBtn.innerHTML = '<span class="btn-icon">✅</span> Active';
            toggleBtn.classList.add('active');
            if (statusDot) statusDot.classList.add('active');
            if (statusText) statusText.innerHTML = 'Active - Click on map to identify features';
            mapContainer.style.cursor = 'crosshair';
            mapContainer.classList.add('identification-active');
            showInstructionOverlay();
            // Add click listener
            map.on('click', onMapClick);
        } else {
            toggleBtn.innerHTML = '<span class="btn-icon">🎯</span> Activate';
            toggleBtn.classList.remove('active');
            if (statusDot) statusDot.classList.remove('active');
            if (statusText) statusText.innerHTML = 'Click button to activate identification tool';
            mapContainer.style.cursor = '';
            mapContainer.classList.remove('identification-active');
            hideInstructionOverlay();
            map.off('click', onMapClick);
        }
    });

    const closeBtn = document.getElementById('closeIdentifyPanel');
    if (closeBtn) closeBtn.addEventListener('click', () => {
        document.getElementById('identifyResultPanel').style.display = 'none';
    });

    document.getElementById('exportIdentifiedCSV')?.addEventListener('click', () => exportIdentifiedData('csv'));
    document.getElementById('exportIdentifiedJSON')?.addEventListener('click', () => exportIdentifiedData('json'));
    document.getElementById('exportIdentifiedPDF')?.addEventListener('click', () => exportIdentifiedData('pdf'));
    document.getElementById('exportIdentifiedSHP')?.addEventListener('click', () => exportIdentifiedData('shp'));
    document.getElementById('saveIdentification')?.addEventListener('click', saveIdentificationSession);
}

function onMapClick(e) {
    if (!identificationMode) return;
    const { lat, lng } = e.latlng;
    const features = identifyFeatures(lat, lng, 50);
    if (features.length === 0) {
        alert('No features found within 50 metres.');
        return;
    }
    showIdentificationResults(features, 'mixed', lat, lng);
}

function showInstructionOverlay() {
    hideInstructionOverlay();
    const overlay = document.createElement('div');
    overlay.id = 'identifyInstructionOverlay';
    overlay.className = 'identify-instruction-overlay';
    overlay.innerHTML = `
        <div class="instruction-content">
            <div class="instruction-icon">🔍</div>
            <div class="instruction-text">
                <strong>Identification Mode Active</strong>
                <p>Click on any feature (manhole, pipeline, suburb) to view its attributes</p>
                <small>Press "Activate" button again to exit</small>
            </div>
        </div>
    `;
    const mapContainer = map.getContainer().parentElement;
    if (mapContainer) {
        mapContainer.style.position = 'relative';
        mapContainer.appendChild(overlay);
    }
    setTimeout(() => {
        if (overlay) overlay.style.opacity = '0';
        setTimeout(() => overlay?.remove(), 500);
    }, 5000);
}

function hideInstructionOverlay() {
    document.getElementById('identifyInstructionOverlay')?.remove();
}

function showIdentificationResults(features, layerType, clickLat, clickLng) {
    currentIdentifiedFeatures = features;
    currentIdentifiedData = {
        timestamp: new Date().toISOString(),
        location: { lat: clickLat, lng: clickLng },
        layer_type: layerType,
        features: features,
        summary: generateSummary(features)
    };
    const panel = document.getElementById('identifyResultPanel');
    const listContainer = document.getElementById('identifyFeatureList');
    if (!panel || !listContainer) return;

    listContainer.innerHTML = features.map((feature, idx) => `
        <div class="identify-feature-card" data-index="${idx}">
            <div class="feature-header">
                <strong>${feature.name || feature.manhole_id || feature.pipe_id || `Feature ${idx+1}`}</strong>
                <span class="feature-type ${feature.type}">${feature.type}</span>
            </div>
            <div class="feature-details">
                ${Object.entries(feature)
                    .filter(([key]) => !['geometry', 'lat', 'lng', 'coordinates', 'type'].includes(key))
                    .map(([k,v]) => `<div class="detail-row"><span class="detail-key">${k}:</span><span class="detail-value">${v ?? '—'}</span></div>`).join('')}
                ${feature.distance !== undefined ? `<div class="detail-row"><span class="detail-key">distance:</span><span class="detail-value">${feature.distance} m</span></div>` : ''}
            </div>
        </div>
    `).join('');

    const summaryHtml = `
        <div class="identify-summary">
            <h6>📊 Summary</h6>
            <div class="summary-row"><span>📍 Total Features:</span><span>${features.length}</span></div>
            <div class="summary-row"><span>🗺️ Click Location:</span><span>${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}</span></div>
            <div class="summary-row"><span>⏱️ Identified:</span><span>${new Date().toLocaleString()}</span></div>
        </div>
    `;
    listContainer.insertAdjacentHTML('afterbegin', summaryHtml);
    panel.style.display = 'block';
}

function generateSummary(features) {
    const summary = { total: features.length, by_type: {}, by_status: {}, by_suburb: {} };
    for (const f of features) {
        const type = f.type || 'unknown';
        summary.by_type[type] = (summary.by_type[type] || 0) + 1;
        const status = f.status || f.bloc_stat || f.block_stat || 'unknown';
        summary.by_status[status] = (summary.by_status[status] || 0) + 1;
        const suburb = f.suburb || f.suburb_nam || 'unknown';
        summary.by_suburb[suburb] = (summary.by_suburb[suburb] || 0) + 1;
    }
    return summary;
}

function exportIdentifiedData(format) {
    if (!currentIdentifiedData) { alert('No data to export'); return; }
    switch(format) {
        case 'csv': exportToCSV(); break;
        case 'json': exportToJSON(); break;
        case 'pdf': exportToPDF(); break;
        case 'shp': exportToGeoJSON(); break;
    }
}

function exportToCSV() {
    if (!currentIdentifiedFeatures.length) return;
    const headers = Object.keys(currentIdentifiedFeatures[0]);
    const rows = currentIdentifiedFeatures.map(f => headers.map(h => f[h] ?? ''));
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    downloadBlob(csv, `identified_${Date.now()}.csv`, 'text/csv');
    alert('CSV exported');
}

function exportToJSON() {
    const json = JSON.stringify(currentIdentifiedData, null, 2);
    downloadBlob(json, `identified_${Date.now()}.json`, 'application/json');
    alert('JSON exported');
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.setTextColor(34,139,34);
    doc.text('Identification Report', 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100,100,100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Click: ${currentIdentifiedData.location.lat.toFixed(6)}, ${currentIdentifiedData.location.lng.toFixed(6)}`, 20, 37);
    doc.text(`Features: ${currentIdentifiedFeatures.length}`, 20, 44);
    const tableData = currentIdentifiedFeatures.slice(0,20).map(f => [
        f.name || f.manhole_id || f.pipe_id || '—',
        f.type || '—',
        f.status || f.bloc_stat || '—',
        f.suburb || f.suburb_nam || '—'
    ]);
    doc.autoTable({
        startY: 55,
        head: [['Name', 'Type', 'Status', 'Suburb']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [34,139,34], textColor: [255,255,255] }
    });
    if (currentIdentifiedFeatures.length > 20)
        doc.text(`... and ${currentIdentifiedFeatures.length-20} more`, 20, doc.lastAutoTable.finalY+10);
    doc.save(`identification_${Date.now()}.pdf`);
    alert('PDF exported');
}

function exportToGeoJSON() {
    const features = currentIdentifiedFeatures.map(f => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [f.lng || 0, f.lat || 0] },
        properties: f
    }));
    const geojson = { type: 'FeatureCollection', features };
    downloadBlob(JSON.stringify(geojson, null, 2), `identified_${Date.now()}.geojson`, 'application/json');
    alert('GeoJSON exported');
}

function downloadBlob(content, filename, mime) {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function saveIdentificationSession() {
    if (!currentIdentifiedData) { alert('No data to save'); return; }
    const name = prompt('Session name:', `Session_${new Date().toISOString().slice(0,19)}`);
    if (!name) return;
    const sessions = JSON.parse(localStorage.getItem('identification_sessions') || '[]');
    sessions.push({ id: Date.now(), name, data: currentIdentifiedData, savedAt: new Date().toISOString() });
    localStorage.setItem('identification_sessions', JSON.stringify(sessions));
    alert(`Session "${name}" saved`);
}

function loadSavedSessions() {
    return JSON.parse(localStorage.getItem('identification_sessions') || '[]');
}

// Public method to set data from main.js
function setData(manholes, pipelines, suburbs) {
    manholesData = manholes || [];
    pipelinesData = pipelines || [];
    suburbsData = suburbs || [];
    console.log(`Identification data updated: ${manholesData.length} manholes, ${pipelinesData.length} pipelines, ${suburbsData.length} suburbs`);
}

function getMap() {
    return MapView.getMap();
}

export default {
    render,
    init: initIdentificationTool,
    setData,
    showResults: showIdentificationResults,
    getMode: () => identificationMode,
    loadSessions: loadSavedSessions,
    getMap
};