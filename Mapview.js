// ============================================
// MAPVIEW.JS - Leaflet Map Component
// Handles all map rendering, layers, markers, etc.
// ============================================

// Tile layer definitions
const TILES = {
    osm: {
        id: "osm",
        label: "Street",
        url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        attr: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
        maxZoom: 19
    },
    satellite: {
        id: "satellite",
        label: "Satellite",
        url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        attr: "Tiles &copy; Esri",
        maxZoom: 19
    },
    topo: {
        id: "topo",
        label: "Topographic",
        url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
        attr: "Map data &copy; OSM | Style &copy; OpenTopoMap",
        maxZoom: 17
    }
};

// Global map instance
let map;
let currentMarkers = [];
let currentLines = [];
let currentPolygons = [];
let activeTileLayers = {};

// Color functions
function getManholeColor(status) {
    if (!status) return "#28a745";
    const s = status.toLowerCase();
    if (s.includes("critical") || s.includes("blocked")) return "#dc3545";
    if (s.includes("warning") || s.includes("maintenance")) return "#ffc107";
    return "#28a745";
}

function getPipeColor(status) {
    if (!status) return "#2b7bff";
    const s = status.toLowerCase();
    if (s.includes("blocked") || s.includes("critical")) return "#dc3545";
    if (s.includes("warning")) return "#ffc107";
    return "#2b7bff";
}

// Custom manhole icon
function createManholeIcon(color, size = 20) {
    return L.divIcon({
        className: "custom-marker",
        html: `<div style="
            background-color: ${color};
            width: ${size}px;
            height: ${size}px;
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            display: flex;
            justify-content: center;
            align-items: center;
            font-size: ${size / 2}px;
            font-weight: bold;
        ">🕳️</div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2 + 4)]
    });
}

// Initialize map
function initMap(centerLat = -18.9735, centerLng = 32.6705, zoom = 13) {
    map = L.map('map').setView([centerLat, centerLng], zoom);
    
    // Add default base layer (OSM)
    activeTileLayers.osm = L.tileLayer(TILES.osm.url, {
        attribution: TILES.osm.attr,
        maxZoom: TILES.osm.maxZoom
    }).addTo(map);
    
    // Add scale bar
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);
    
    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    
    // Track mouse position
    map.on('mousemove', (e) => {
        const coordStatus = document.getElementById('coordStatus');
        if (coordStatus) {
            coordStatus.innerHTML = `LAT: ${e.latlng.lat.toFixed(6)} | LNG: ${e.latlng.lng.toFixed(6)} | ZOOM: ${map.getZoom()}`;
        }
    });
    
    return map;
}

// Switch base map
function switchBaseMap(tileId) {
    // Remove all existing tile layers
    Object.values(activeTileLayers).forEach(layer => {
        if (layer) map.removeLayer(layer);
    });
    
    // Add the selected tile layer
    const tile = TILES[tileId];
    if (tile) {
        activeTileLayers[tileId] = L.tileLayer(tile.url, {
            attribution: tile.attr,
            maxZoom: tile.maxZoom
        }).addTo(map);
    }
    
    // Keep reference to current
    activeTileLayers.current = tileId;
}

// Load manholes (point layer)
function loadManholes(manholes) {
    // Clear existing manhole markers
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];
    
    manholes.forEach(manhole => {
        if (manhole.lat && manhole.lng) {
            const color = getManholeColor(manhole.status);
            const marker = L.marker([manhole.lat, manhole.lng], {
                icon: createManholeIcon(color, 22)
            });
            
            marker.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="color: #228B22; margin-bottom: 8px;">🕳️ ${manhole.asset_code || manhole.name || 'Manhole'}</h4>
                    <table style="width:100%; font-size:12px;">
                        <tr><td><b>ID:</b></td><td>${manhole.id || 'N/A'}</td></tr>
                        <tr><td><b>Suburb:</b></td><td>${manhole.suburb || 'N/A'}</td></tr>
                        <tr><td><b>Diameter:</b></td><td>${manhole.diameter ? manhole.diameter + ' mm' : 'N/A'}</td></tr>
                        <tr><td><b>Depth:</b></td><td>${manhole.depth ? manhole.depth + ' m' : 'N/A'}</td></tr>
                        <tr><td><b>Status:</b></td><td style="color:${color}">${manhole.status || 'Normal'}</td></tr>
                        <tr><td><b>Blockages:</b></td><td>${manhole.blockages || 0}</td></tr>
                    </table>
                    <button onclick="window.zoomToAsset(${manhole.lat}, ${manhole.lng})" style="margin-top:8px; width:100%; background:#1a3a1a; border:1px solid #228B22; color:#228B22; padding:4px; border-radius:4px; cursor:pointer;">ZOOM TO</button>
                </div>
            `);
            
            marker.addTo(map);
            currentMarkers.push(marker);
        }
    });
}

// Load pipelines (line layer)
function loadPipelines(pipelines) {
    // Clear existing pipeline lines
    currentLines.forEach(line => map.removeLayer(line));
    currentLines = [];
    
    pipelines.forEach(pipe => {
        if (pipe.coordinates && pipe.coordinates.length >= 2) {
            const color = getPipeColor(pipe.status);
            const polyline = L.polyline(pipe.coordinates, {
                color: color,
                weight: 5,
                opacity: 0.9
            });
            
            polyline.bindPopup(`
                <div style="min-width: 200px;">
                    <h4 style="color: #228B22; margin-bottom: 8px;">📏 ${pipe.asset_code || pipe.name || 'Pipeline'}</h4>
                    <table style="width:100%; font-size:12px;">
                        <tr><td><b>ID:</b></td><td>${pipe.id || 'N/A'}</td></tr>
                        <tr><td><b>Start MH:</b></td><td>${pipe.start_manhole || 'N/A'}</td></tr>
                        <tr><td><b>End MH:</b></td><td>${pipe.end_manhole || 'N/A'}</td></tr>
                        <tr><td><b>Diameter:</b></td><td>${pipe.diameter ? pipe.diameter + ' mm' : 'N/A'}</td></tr>
                        <tr><td><b>Material:</b></td><td>${pipe.material || 'N/A'}</td></tr>
                        <tr><td><b>Status:</b></td><td style="color:${color}">${pipe.status || 'Normal'}</td></tr>
                    </table>
                    <button onclick="window.zoomToLine(${pipe.coordinates[0][0]}, ${pipe.coordinates[0][1]})" style="margin-top:8px; width:100%; background:#1a3a1a; border:1px solid #228B22; color:#228B22; padding:4px; border-radius:4px; cursor:pointer;">ZOOM TO</button>
                </div>
            `);
            
            polyline.addTo(map);
            currentLines.push(polyline);
        }
    });
}

// Load suburbs (polygon layer)
function loadSuburbs(suburbs) {
    // Clear existing polygons
    currentPolygons.forEach(polygon => map.removeLayer(polygon));
    currentPolygons = [];
    
    suburbs.forEach(suburb => {
        if (suburb.coordinates && suburb.coordinates.length >= 3) {
            const polygon = L.polygon(suburb.coordinates, {
                color: "#228B22",
                weight: 2,
                fillColor: "#228B22",
                fillOpacity: 0.15
            });
            
            polygon.bindPopup(`
                <div>
                    <h4 style="color: #228B22;">🏘️ ${suburb.name}</h4>
                    <p>Area: ${suburb.area ? suburb.area.toFixed(2) + ' km²' : 'N/A'}</p>
                    <p>Assets: ${suburb.asset_count || 0}</p>
                    <p>Blockages: ${suburb.blockages || 0}</p>
                </div>
            `);
            
            polygon.addTo(map);
            currentPolygons.push(polygon);
        }
    });
}

// Add heatmap layer
let heatLayer = null;
function addHeatmap(heatPoints) {
    if (heatLayer) map.removeLayer(heatLayer);
    heatLayer = L.heatLayer(heatPoints, {
        radius: 25,
        blur: 15,
        maxZoom: 17,
        minOpacity: 0.3
    });
    heatLayer.addTo(map);
}

function clearHeatmap() {
    if (heatLayer) map.removeLayer(heatLayer);
    heatLayer = null;
}

// Fit map to show all assets
function fitToBounds() {
    const allPoints = [];
    currentMarkers.forEach(marker => {
        const latlng = marker.getLatLng();
        allPoints.push([latlng.lat, latlng.lng]);
    });
    
    if (allPoints.length > 0) {
        const bounds = L.latLngBounds(allPoints);
        map.fitBounds(bounds, { padding: [50, 50] });
    }
}

// Zoom to specific asset
window.zoomToAsset = function(lat, lng) {
    map.setView([lat, lng], 18);
};

window.zoomToLine = function(lat, lng) {
    map.setView([lat, lng], 16);
};

// Get map instance
function getMap() {
    return map;
}

// Export functions for use in main script
window.MapView = {
    init: initMap,
    switchBaseMap: switchBaseMap,
    loadManholes: loadManholes,
    loadPipelines: loadPipelines,
    loadSuburbs: loadSuburbs,
    addHeatmap: addHeatmap,
    clearHeatmap: clearHeatmap,
    fitToBounds: fitToBounds,
    getMap: getMap
};
