// ============================================
// MAPVIEW.JS - Complete Working Map Component
// Supports: Points (manholes), Lines (pipelines), Polygons (suburbs & cadastre)
// Data fetched from Python Flask backend API
// Integrated with Report Processor and Statistics
// FIXED: Suburb polygon rendering with proper styling and coordinate validation
// ADDED: Filter change listener to update map dynamically
// ============================================

let map = null;
let currentManholeMarkers = [];
let currentPipelineLayer = null;
let currentSuburbLayer = null;
let currentComplaintMarkers = [];
let currentComplaintLayer = null;
let heatLayer = null;
let currentBounds = null;
let suburbLabels = [];
let cadastreLabels = [];

// Store complaint buffers
let currentComplaintBuffers = [];
let originalPipelineColor = '#32cd32';

// Cadastre layer
let currentCadastreLayer = null;

// Loading indicator for map
let mapLoadingIndicator = null;

// ---------- API CONFIGURATION ----------
const API_BASE_URL = 'http://localhost:5000/api';
const API_ENDPOINTS = {
    manholes: '/manholes/geojson',
    pipelines: '/pipelines/geojson',
    suburbs: '/suburbs/geojson',
    complaints: '/complaints/geojson',
    cadastre: '/cadastre/all'
};

// ---------- HELPER: Fetch GeoJSON from API ----------
async function fetchLayerFromAPI(endpoint, bounds = null, simplify = 0.001, limit = 5000) {
    let url;
    
    // For suburbs and cadastre, always fetch all data without viewport filtering
    if (endpoint === '/suburbs/geojson' || endpoint === '/cadastre/all') {
        url = `${API_BASE_URL}${endpoint}`;
        try {
            console.log(`Fetching all data from: ${url}`);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            console.log(`Fetched ${data.features?.length || 0} features from ${endpoint}`);
            return data;
        } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            return { type: 'FeatureCollection', features: [] };
        }
    }
    
    // For manholes and pipelines, use viewport filtering if bounds provided
    if (bounds) {
        const params = new URLSearchParams({
            min_lon: bounds.getWest(),
            min_lat: bounds.getSouth(),
            max_lon: bounds.getEast(),
            max_lat: bounds.getNorth(),
            simplify: simplify,
            limit: limit
        });
        url = `${API_BASE_URL}${endpoint}?${params}`;
    } else {
        url = `${API_BASE_URL}${endpoint}?simplify=${simplify}&limit=${limit}`;
    }
    
    try {
        console.log(`Fetching from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const geojson = await response.json();
        console.log(`Fetched ${geojson.features?.length || 0} features from ${endpoint}`);
        return geojson;
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        return { type: 'FeatureCollection', features: [] };
    }
}

// ============================================
// MAP LOADING INDICATOR
// ============================================

function showMapLoading(show, message = 'Updating map...') {
    if (!mapLoadingIndicator) {
        mapLoadingIndicator = document.createElement('div');
        mapLoadingIndicator.id = 'map-loading-indicator';
        mapLoadingIndicator.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.8);
            color: #8fdc00;
            padding: 12px 24px;
            border-radius: 8px;
            font-family: monospace;
            font-size: 14px;
            z-index: 2000;
            display: none;
            backdrop-filter: blur(4px);
            border: 1px solid #8fdc00;
            white-space: nowrap;
        `;
        document.querySelector('.map-container')?.appendChild(mapLoadingIndicator);
    }
    
    if (mapLoadingIndicator) {
        mapLoadingIndicator.style.display = show ? 'flex' : 'none';
        if (show) mapLoadingIndicator.innerHTML = `⏳ ${message}`;
    }
}

// Simple loading indicator (bottom right)
let loadingDiv = null;
function showLoadingIndicator(show) {
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'map-loading';
        loadingDiv.style.cssText = 'position: absolute; bottom: 20px; right: 20px; background: rgba(0,0,0,0.7); color: white; padding: 5px 10px; border-radius: 4px; font-size: 12px; z-index: 1000; display: none;';
        document.querySelector('.map-container')?.appendChild(loadingDiv);
    }
    if (loadingDiv) {
        loadingDiv.style.display = show ? 'block' : 'none';
        if (show) loadingDiv.innerHTML = '🔄 Loading sewer data...';
        else loadingDiv.innerHTML = '✅ Data loaded';
        setTimeout(() => {
            if (!show && loadingDiv) loadingDiv.style.display = 'none';
        }, 2000);
    }
}

// ============================================
// FILTER CHANGE LISTENER
// ============================================

function setupFilterListener() {
    document.addEventListener('filtersChanged', async (event) => {
        const { manholes, pipelines, filters, manholeCount, pipelineCount, totalCount } = event.detail;
        console.log('🎯 Filters changed, updating map...', { manholeCount, pipelineCount, filters });
        
        showMapLoading(true, `Filtering: ${totalCount || 0} features...`);
        
        try {
            // Clear existing layers
            clearManholes();
            clearPipelines();
            
            // Load filtered manholes
            if (manholes && manholes.length > 0) {
                const manholesGeoJSON = {
                    type: 'FeatureCollection',
                    features: manholes.map(m => ({
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: [m.lng || m.longitude, m.lat || m.latitude]
                        },
                        properties: {
                            manhole_id: m.manhole_id,
                            suburb: m.suburb,
                            status: m.status,
                            depth: m.depth,
                            inspector: m.inspector,
                            inspection_date: m.inspection_date
                        }
                    })).filter(f => f.geometry.coordinates[0] && f.geometry.coordinates[1])
                };
                loadManholesFromGeoJSON(manholesGeoJSON);
                console.log(`✅ Loaded ${manholes.length} filtered manholes`);
            } else {
                console.log('No manholes match the current filters');
            }
            
            // Load filtered pipelines
            if (pipelines && pipelines.length > 0) {
                const pipelinesGeoJSON = {
                    type: 'FeatureCollection',
                    features: pipelines.map(p => ({
                        type: 'Feature',
                        geometry: p.geometry,
                        properties: {
                            pipe_id: p.pipe_id,
                            status: p.status,
                            material: p.material,
                            diameter: p.diameter,
                            length: p.length
                        }
                    }))
                };
                loadPipelinesFromGeoJSON(pipelinesGeoJSON);
                console.log(`✅ Loaded ${pipelines.length} filtered pipelines`);
            } else {
                console.log('No pipelines match the current filters');
            }
            
            // Update statistics display if element exists
            updateMapStats(manholes?.length || 0, pipelines?.length || 0);
            
            // Fit bounds to show filtered data
            fitToVisibleLayers();
            
        } catch (error) {
            console.error('Error updating map with filters:', error);
            showMapLoading(false);
        } finally {
            setTimeout(() => showMapLoading(false), 500);
        }
    });
    
    console.log('✅ Filter change listener registered');
}

function updateMapStats(manholeCount, pipelineCount) {
    const statsEl = document.getElementById('mapStats');
    if (statsEl) {
        statsEl.innerHTML = `🕳️ ${manholeCount} manholes | 📏 ${pipelineCount} pipelines`;
    }
}

function fitToVisibleLayers() {
    if (!map) return;
    
    const allLayers = [];
    
    // Add manhole markers
    if (currentManholeMarkers.length > 0) {
        currentManholeMarkers.forEach(m => allLayers.push(m.getLatLng()));
    }
    
    // Add pipeline layer bounds
    if (currentPipelineLayer) {
        try {
            const bounds = currentPipelineLayer.getBounds();
            if (bounds.isValid()) {
                allLayers.push(bounds.getSouthWest());
                allLayers.push(bounds.getNorthEast());
            }
        } catch(e) {}
    }
    
    // Add suburb layer bounds
    if (currentSuburbLayer) {
        try {
            const bounds = currentSuburbLayer.getBounds();
            if (bounds.isValid()) {
                allLayers.push(bounds.getSouthWest());
                allLayers.push(bounds.getNorthEast());
            }
        } catch(e) {}
    }
    
    if (allLayers.length > 0) {
        const bounds = L.latLngBounds(allLayers);
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
            console.log('📐 Map fit to visible layers');
        }
    }
}

// ============================================
// CLEAR FUNCTIONS
// ============================================

function clearManholes() {
    currentManholeMarkers.forEach(m => {
        if (map && map.hasLayer(m)) map.removeLayer(m);
    });
    currentManholeMarkers = [];
    console.log('Manholes cleared from map');
}

function clearPipelines() {
    if (currentPipelineLayer && map && map.hasLayer(currentPipelineLayer)) {
        map.removeLayer(currentPipelineLayer);
        currentPipelineLayer = null;
        console.log('Pipelines cleared from map');
    }
}

function clearSuburbs() {
    if (currentSuburbLayer && map && map.hasLayer(currentSuburbLayer)) {
        if (suburbLabels.length) {
            suburbLabels.forEach(label => {
                if (map.hasLayer(label)) map.removeLayer(label);
            });
            suburbLabels = [];
        }
        map.removeLayer(currentSuburbLayer);
        currentSuburbLayer = null;
        console.log('Suburbs cleared from map');
    }
}

function clearCadastre() {
    if (currentCadastreLayer && map && map.hasLayer(currentCadastreLayer)) {
        if (cadastreLabels.length) {
            cadastreLabels.forEach(label => {
                if (map.hasLayer(label)) map.removeLayer(label);
            });
            cadastreLabels = [];
        }
        map.removeLayer(currentCadastreLayer);
        currentCadastreLayer = null;
        console.log('Cadastre cleared from map');
    }
}

function clearComplaints() {
    currentComplaintMarkers.forEach(m => {
        if (map && map.hasLayer(m)) map.removeLayer(m);
    });
    currentComplaintMarkers = [];
    console.log('Complaints cleared from map');
}

// ============================================
// TILE DEFINITIONS
// ============================================

const TILES = {
    osm: { id: 'osm', label: 'Street', icon: '🗺️', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: '&copy; OpenStreetMap', maxZoom: 19 },
    satellite: { id: 'satellite', label: 'Satellite', icon: '🛰️', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attr: 'Tiles &copy; Esri', maxZoom: 19 },
    hybrid: { id: 'hybrid', label: 'Hybrid', icon: '🌍', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', overlayUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attr: 'Imagery &copy; Esri | Roads &copy; OSM', maxZoom: 19 },
    topo: { id: 'topo', label: 'Topographic', icon: '⛰️', url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', attr: 'Map data &copy; OSM | Style &copy; OpenTopoMap', maxZoom: 17 }
};

let currentTileLayer = null;
let currentOverlayLayer = null;

// ============================================
// INITIALIZE MAP
// ============================================

function initMap(centerLat = -18.97, centerLng = 32.67, zoom = 13) {
    console.log('initMap called');
    const mapElement = document.getElementById('map');
    if (!mapElement) {
        console.error('Map element not found!');
        return null;
    }
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded!');
        return null;
    }
    try {
        map = L.map('map').setView([centerLat, centerLng], zoom);
        currentTileLayer = L.tileLayer(TILES.osm.url, {
            attribution: TILES.osm.attr,
            maxZoom: TILES.osm.maxZoom
        }).addTo(map);
        L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);
        
        map.on('mousemove', function(e) {
            const coordStatus = document.getElementById('coordStatus');
            if (coordStatus) coordStatus.innerHTML = `📍 ${e.latlng.lat.toFixed(6)}, ${e.latlng.lng.toFixed(6)} | Zoom: ${map.getZoom()}`;
        });
        
        console.log('Map created successfully');
        setTimeout(() => addDropdownTileSelector(), 100);
        
        // Setup filter listener
        setupFilterListener();
        
        document.dispatchEvent(new CustomEvent('mapReady'));
        addPulseAnimation();
        
        return map;
    } catch (error) {
        console.error('Error creating map:', error);
        return null;
    }
}

// ============================================
// SWITCH BASE MAP
// ============================================

function switchBaseMap(tileType) {
    if (!map) return;
    const tile = TILES[tileType];
    if (!tile) return;
    if (currentTileLayer) map.removeLayer(currentTileLayer);
    if (currentOverlayLayer) map.removeLayer(currentOverlayLayer);
    currentTileLayer = L.tileLayer(tile.url, { attribution: tile.attr, maxZoom: tile.maxZoom }).addTo(map);
    if (tileType === 'hybrid' && tile.overlayUrl) {
        currentOverlayLayer = L.tileLayer(tile.overlayUrl, { opacity: 0.5 }).addTo(map);
    }
    updateDropdownButtonText(tileType);
}

function updateDropdownButtonText(tileType) {
    const btnText = document.getElementById('selectedTileText');
    if (btnText && TILES[tileType]) btnText.innerHTML = `${TILES[tileType].icon} ${TILES[tileType].label}`;
}

function addDropdownTileSelector() {
    const mapContainer = document.querySelector('.map-container');
    if (!mapContainer) return;
    const existing = document.querySelector('.dropdown-tile-selector');
    if (existing) existing.remove();
    const dropdownDiv = document.createElement('div');
    dropdownDiv.className = 'dropdown-tile-selector';
    dropdownDiv.style.cssText = `position: absolute; top: 10px; right: 10px; z-index: 1000; font-family: 'Segoe UI', monospace;`;
    dropdownDiv.innerHTML = `
        <div style="position: relative;">
            <button id="tileDropdownBtn" style="background: rgba(10, 26, 10, 0.95); backdrop-filter: blur(8px); border: 1px solid forestgreen; border-radius: 6px; padding: 8px 12px; cursor: pointer; font-size: 12px; font-weight: bold; color: #8fdc00; display: flex; align-items: center; gap: 8px; min-width: 130px;">
                <span id="selectedTileText">🗺️ Street</span>
                <span style="font-size: 10px;">▼</span>
            </button>
            <div id="tileDropdownMenu" style="display: none; position: absolute; top: 100%; right: 0; margin-top: 4px; background: rgba(10, 26, 10, 0.95); backdrop-filter: blur(8px); border: 1px solid forestgreen; border-radius: 6px; min-width: 150px; overflow: hidden; z-index: 1001;">
                ${Object.values(TILES).map(tile => `<div class="tile-dropdown-item" data-tile="${tile.id}" style="padding: 8px 12px; cursor: pointer; font-size: 12px; color: #7ab87a; display: flex; align-items: center; gap: 8px; transition: all 0.2s; border-bottom: 1px solid #1a3a1a;"><span>${tile.icon}</span><span>${tile.label}</span></div>`).join('')}
            </div>
        </div>
    `;
    mapContainer.appendChild(dropdownDiv);
    
    document.getElementById('tileDropdownBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        const menu = document.getElementById('tileDropdownMenu');
        menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
    });
    document.addEventListener('click', function(e) {
        if (dropdownDiv && !dropdownDiv.contains(e.target)) document.getElementById('tileDropdownMenu').style.display = 'none';
    });
    document.querySelectorAll('.tile-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            switchBaseMap(item.dataset.tile);
            document.getElementById('tileDropdownMenu').style.display = 'none';
            document.querySelectorAll('.tile-dropdown-item').forEach(i => {
                i.style.background = 'transparent';
                i.style.color = '#7ab87a';
            });
            item.style.background = '#2a4a2a';
            item.style.color = '#8fdc00';
        });
    });
}

// ============================================
// LOAD MANHOLES
// ============================================

function loadManholesFromGeoJSON(geojson) {
    if (!map) {
        console.error('Map not initialized, cannot load manholes');
        return;
    }
    
    clearManholes();
    
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        console.log('No manholes data to load');
        return;
    }
    
    let criticalCount = 0;
    let warningCount = 0;
    let goodCount = 0;
    
    geojson.features.forEach(feature => {
        const coords = feature.geometry?.coordinates;
        if (!coords || !coords[0] || !coords[1]) return;
        const props = feature.properties;
        
        let color = '#9b59b6';
        let statusText = 'Normal';
        
        if (props.status === 'critical' || props.status === 'Blocked') {
            color = '#dc3545';
            statusText = 'Critical';
            criticalCount++;
        } else if (props.status === 'warning' || props.status === 'Partial') {
            color = '#ffc107';
            statusText = 'Warning';
            warningCount++;
        } else {
            goodCount++;
        }
        
        const marker = L.circleMarker([coords[1], coords[0]], {
            radius: 8,
            color: color,
            fillColor: color,
            fillOpacity: 0.7,
            weight: 2
        });
        
        marker.bindPopup(`
            <b>🕳️ ${props.manhole_id || 'Manhole'}</b><br>
            Suburb: ${props.suburb || 'N/A'}<br>
            Status: <span style="color:${color}">${statusText}</span><br>
            Depth: ${props.depth || 'N/A'} m<br>
            Inspector: ${props.inspector || 'N/A'}
        `);
        marker.addTo(map);
        currentManholeMarkers.push(marker);
    });
    
    console.log(`Loaded ${currentManholeMarkers.length} manholes (${criticalCount} critical, ${warningCount} warning, ${goodCount} good)`);
}

// ============================================
// LOAD PIPELINES
// ============================================

function loadPipelinesFromGeoJSON(geojson) {
    if (!map) {
        console.error('Map not initialized, cannot load pipelines');
        return;
    }
    
    clearPipelines();
    
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        console.log('No pipelines data to load');
        return;
    }
    
    currentPipelineLayer = L.geoJSON(geojson, {
        style: (feature) => {
            const status = feature.properties?.status;
            let color = '#32cd32';
            if (status === 'Blocked' || status === 'critical') color = '#dc3545';
            else if (status === 'Partial' || status === 'warning') color = '#ffc107';
            return { color: color, weight: 4, opacity: 0.8 };
        },
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            layer.bindPopup(`
                <b>📏 Pipe ${props.pipe_id || 'unknown'}</b><br>
                Material: ${props.material || 'N/A'}<br>
                Diameter: ${props.diameter || 'N/A'} mm<br>
                Length: ${props.length || 'N/A'} m<br>
                Status: ${props.status || 'good'}
            `);
        }
    }).addTo(map);
    console.log(`Loaded ${geojson.features.length} pipelines to map`);
}

// ============================================
// LOAD SUBURBS
// ============================================

function loadSuburbsFromGeoJSON(geojson) {
    if (!map) {
        console.error('Map not initialized, cannot load suburbs');
        return;
    }
    
    clearSuburbs();
    
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        console.log('No suburbs data to load');
        return;
    }
    
    console.log(`Loading ${geojson.features.length} suburbs to map`);
    
    // Style for suburbs - WITH FILL FOR VISIBILITY
    const suburbStyle = {
        color: '#00d4ff',
        weight: 3,
        opacity: 0.9,
        fill: true,
        fillColor: '#00d4ff',
        fillOpacity: 0.15
    };
    
    currentSuburbLayer = L.geoJSON(geojson, {
        style: suburbStyle,
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const suburbName = props.suburb_nam || props.name || 'Unnamed';
            
            layer.bindPopup(`
                <b>🏘️ ${suburbName}</b><br>
                Township: ${props.township || 'N/A'}<br>
                Ward: ${props.ward || 'N/A'}<br>
                Zone: ${props.zone || 'N/A'}<br>
                Op Zone: ${props.op_zone || 'N/A'}
            `);
            
            layer.on('mouseover', function() {
                layer.setStyle({ fillOpacity: 0.35, weight: 4, color: '#ff7800' });
            });
            
            layer.on('mouseout', function() {
                layer.setStyle(suburbStyle);
            });
        }
    }).addTo(map);
    
    console.log(`Suburbs layer added with ${geojson.features.length} suburbs`);
}

// ============================================
// LOAD COMPLAINTS
// ============================================

function loadComplaintsFromGeoJSON(geojson) {
    if (!map) return;
    clearComplaints();
    
    if (!geojson || !geojson.features || geojson.features.length === 0) return;
    
    geojson.features.forEach(feature => {
        const coords = feature.geometry?.coordinates;
        if (!coords) return;
        const props = feature.properties;
        const color = props.status === 'resolved' ? '#28a745' : '#dc3545';
        const marker = L.circleMarker([coords[1], coords[0]], {
            radius: 10, color: color, fillColor: color, fillOpacity: 0.8, weight: 3
        });
        marker.bindPopup(`
            <b>⚠️ Complaint</b><br>
            Address: ${props.address || 'Unknown'}<br>
            Status: ${props.status || 'pending'}<br>
            Date: ${props.created_at ? new Date(props.created_at).toLocaleDateString() : 'N/A'}
        `);
        marker.addTo(map);
        currentComplaintMarkers.push(marker);
    });
    console.log(`Loaded ${currentComplaintMarkers.length} complaints to map`);
}

// ============================================
// LOAD CADASTRE
// ============================================

function loadCadastreFromGeoJSON(geojson) {
    if (!map) return;
    clearCadastre();
    
    if (!geojson || !geojson.features || geojson.features.length === 0) {
        console.log('No cadastre data to load');
        return;
    }
    
    console.log(`Loading ${geojson.features.length} cadastre stands to map`);
    
    currentCadastreLayer = L.geoJSON(geojson, {
        style: {
            color: '#2e7d52',
            weight: 1.5,
            opacity: 0.6,
            fill: false,
            fillOpacity: 0
        },
        onEachFeature: (feature, layer) => {
            const props = feature.properties;
            const standNumber = props.stand_number;
            
            if (standNumber) {
                const center = layer.getBounds().getCenter();
                const label = L.marker(center, {
                    icon: L.divIcon({
                        className: 'cadastre-label',
                        html: `<div style="font-family: monospace; font-size: 8px; color: #a5d6a7; background: rgba(46,82,69,0.8); padding: 2px 4px; border-radius: 2px;">${standNumber}</div>`,
                        iconSize: [null, null]
                    }),
                    interactive: false
                }).addTo(map);
                cadastreLabels.push(label);
            }
            
            layer.bindPopup(`
                <b>🏠 Stand: ${standNumber || 'N/A'}</b><br>
                Suburb: ${props.suburb_name || 'N/A'}<br>
                Ward: ${props.ward || 'N/A'}<br>
                Area: ${props.area_hectares ? props.area_hectares.toFixed(2) : 'N/A'} ha
            `);
        }
    }).addTo(map);
    
    console.log(`Cadastre loaded: ${geojson.features.length} stands`);
}

// ============================================
// COMPLAINTS WITH BUFFERS
// ============================================

function showComplaintsWithBuffers(complaints, reportDate) {
    clearComplaintBuffers();
    if (!complaints?.length) return;
    
    complaints.forEach((complaint, idx) => {
        if (complaint.latitude && complaint.longitude) {
            const isExact = complaint.confidence === 'high';
            const bufferRadius = complaint.buffer_radius || (isExact ? 30 : 100);
            const markerColor = isExact ? '#dc3545' : '#ff9800';
            
            const marker = L.circleMarker([complaint.latitude, complaint.longitude], {
                radius: 12, color: markerColor, fillColor: markerColor, fillOpacity: 0.9, weight: 3
            });
            const bufferCircle = L.circle([complaint.latitude, complaint.longitude], {
                radius: bufferRadius, color: '#ff9800', fillColor: '#ff9800', fillOpacity: 0.15, weight: 2, className: 'pulse-circle'
            }).addTo(map);
            marker.bindPopup(`
                <b>⚠️ Complaint #${idx+1}</b><br>
                Address: ${complaint.address}<br>
                Confidence: ${complaint.confidence || 'medium'}<br>
                Buffer: ${bufferRadius}m
            `);
            marker.addTo(map);
            currentComplaintBuffers.push({ marker, buffer: bufferCircle, data: complaint });
        }
    });
    
    if (currentComplaintBuffers.length) {
        const bounds = L.latLngBounds(currentComplaintBuffers.map(c => c.marker.getLatLng()));
        if (bounds.isValid()) map.fitBounds(bounds.pad(0.1));
    }
    
    console.log(`Displayed ${currentComplaintBuffers.length} complaints with buffers`);
}

function clearComplaintBuffers() {
    currentComplaintBuffers.forEach(item => {
        if (item.marker && map.hasLayer(item.marker)) map.removeLayer(item.marker);
        if (item.buffer && map.hasLayer(item.buffer)) map.removeLayer(item.buffer);
    });
    currentComplaintBuffers = [];
}

function showComplaintMarkers(complaints) {
    clearComplaints();
    if (!complaints?.length) return;
    complaints.forEach(c => {
        const marker = L.circleMarker([c.latitude, c.longitude], {
            radius: 10, color: '#dc3545', fillColor: '#dc3545', fillOpacity: 0.8, weight: 3
        });
        marker.bindPopup(`<b>⚠️ Complaint</b><br>Address: ${c.address}`);
        marker.addTo(map);
        currentComplaintMarkers.push(marker);
    });
}

// ============================================
// HEATMAP FUNCTIONS
// ============================================

function showHeatmapFromManholes(manholesArray) {
    if (!map) return;
    if (heatLayer && map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    if (!manholesArray?.length) return;
    const points = manholesArray.map(m => [m.lat, m.lng, m.blockages || 1]);
    heatLayer = L.heatLayer(points, { radius: 25, blur: 15 }).addTo(map);
}

function showHeatmapFromCurrentMarkers() {
    if (!map || !currentManholeMarkers.length) return;
    const points = currentManholeMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng, 1]);
    if (heatLayer && map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    heatLayer = L.heatLayer(points, { radius: 25, blur: 15 }).addTo(map);
}

function showHeatmapFromComplaints() {
    if (!map || !currentComplaintMarkers.length) return;
    const points = currentComplaintMarkers.map(m => [m.getLatLng().lat, m.getLatLng().lng, 1]);
    if (heatLayer && map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    heatLayer = L.heatLayer(points, { radius: 30, blur: 20 }).addTo(map);
}

function clearHeatmap() {
    if (heatLayer && map.hasLayer(heatLayer)) map.removeLayer(heatLayer);
    heatLayer = null;
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

function fitToBounds() {
    if (!map) return;
    const allMarkers = [...currentManholeMarkers, ...currentComplaintMarkers];
    if (!allMarkers.length) {
        if (currentSuburbLayer) {
            try {
                const bounds = currentSuburbLayer.getBounds();
                if (bounds.isValid()) map.fitBounds(bounds);
            } catch(e) {}
        }
        return;
    }
    const bounds = L.latLngBounds(allMarkers.map(m => m.getLatLng()));
    if (bounds.isValid()) map.fitBounds(bounds);
}

function fitToComplaints() {
    if (!map || !currentComplaintMarkers.length) return;
    const bounds = L.latLngBounds(currentComplaintMarkers.map(m => m.getLatLng()));
    if (bounds.isValid()) map.fitBounds(bounds);
}

function getMap() { return map; }

function loadManholes(manholesArray) {
    if (!manholesArray?.length) {
        clearManholes();
        return;
    }
    const geojson = {
        type: 'FeatureCollection',
        features: manholesArray.map(m => ({
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [parseFloat(m.lng), parseFloat(m.lat)] },
            properties: m
        }))
    };
    loadManholesFromGeoJSON(geojson);
}

function addPulseAnimation() {
    if (!document.getElementById('pulse-style')) {
        const style = document.createElement('style');
        style.id = 'pulse-style';
        style.textContent = `@keyframes pulse{0%{stroke-width:2;stroke-opacity:1}50%{stroke-width:5;stroke-opacity:0.5}100%{stroke-width:2;stroke-opacity:1}}.pulse-circle{animation:pulse 1.5s ease-out infinite}`;
        document.head.appendChild(style);
    }
}

// ============================================
// EXPORTS
// ============================================

export default {
    init: initMap,
    switchBaseMap: switchBaseMap,
    getMap: getMap,
    loadManholesFromGeoJSON: loadManholesFromGeoJSON,
    loadPipelinesFromGeoJSON: loadPipelinesFromGeoJSON,
    loadSuburbsFromGeoJSON: loadSuburbsFromGeoJSON,
    loadComplaintsFromGeoJSON: loadComplaintsFromGeoJSON,
    loadCadastreFromGeoJSON: loadCadastreFromGeoJSON,
    loadManholes: loadManholes,
    clearPipelines: clearPipelines,
    clearSuburbs: clearSuburbs,
    clearComplaints: clearComplaints,
    clearCadastre: clearCadastre,
    showComplaintMarkers: showComplaintMarkers,
    showComplaintsWithBuffers: showComplaintsWithBuffers,
    clearComplaintBuffers: clearComplaintBuffers,
    showHeatmapFromManholes: showHeatmapFromManholes,
    showHeatmapFromCurrentMarkers: showHeatmapFromCurrentMarkers,
    showHeatmapFromComplaints: showHeatmapFromComplaints,
    clearHeatmap: clearHeatmap,
    fitToBounds: fitToBounds,
    fitToComplaints: fitToComplaints
};

// Global function for button callbacks
window.markComplaintResolved = async (complaintId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/resolve`, { method: 'PUT' });
        if (response.ok) {
            alert('Complaint marked as resolved!');
            document.dispatchEvent(new CustomEvent('dataRefreshed'));
        }
    } catch (error) {
        console.error('Error resolving complaint:', error);
    }
};

window.zoomToStand = (lat, lng) => { if (map) map.setView([lat, lng], 18); };
