// components/layermanager.js - Layer Manager Component
// Integrated with Flask backend API and mapview module

import MapView from './mapview.js';

// API base URL (Flask backend on port 5000)
const API_BASE_URL = 'http://localhost:5000/api';

// Layer definitions – matches your actual database tables
let availableLayers = [
    { id: 'manholes', tableName: 'waste_water_manhole', type: 'point', visible: true, color: '#9b59b6', apiEndpoint: '/manholes/list' },
    { id: 'pipelines', tableName: 'waste_water_pipeline', type: 'line', visible: true, color: '#32cd32', apiEndpoint: '/pipelines/geojson' },
    { id: 'suburbs', tableName: 'suburbs', type: 'polygon', visible: false, color: '#000000', apiEndpoint: '/suburbs' }
];

let layerVisibility = {
    manholes: true,
    pipelines: true,
    suburbs: false
};

// Store references to map layers (managed by mapview, but we track visibility)
let layerLoaded = {
    manholes: false,
    pipelines: false,
    suburbs: false
};

// ============================================
// RENDER FUNCTIONS
// ============================================

// Render the menu icon (dropdown) - goes at top
function renderMenuIcon() {
    return `
        <div class="menu-dropdown">
            <button id="menuIconBtn" class="menu-icon-btn">☰ MENU</button>
            <div id="menuDropdown" class="menu-dropdown-content">
                <div class="menu-section">
                    <div class="menu-section-title">📁 PROJECT</div>
                    <div class="menu-item" data-action="newProject">📄 New Project</div>
                    <div class="menu-item" data-action="openProject">📂 Open Project</div>
                    <div class="menu-item" data-action="saveProject">💾 Save Project</div>
                    <div class="menu-item" data-action="saveAsProject">📑 Save As</div>
                    <div class="menu-divider"></div>
                    <div class="menu-item" data-action="exportMap">📸 Export Map</div>
                    <div class="menu-item" data-action="printLayout">🖨️ Print Layout</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">✏️ EDIT</div>
                    <div class="menu-item" data-action="undo">↩️ Undo</div>
                    <div class="menu-item" data-action="redo">↪️ Redo</div>
                    <div class="menu-item" data-action="cut">✂️ Cut</div>
                    <div class="menu-item" data-action="copy">📋 Copy</div>
                    <div class="menu-item" data-action="paste">📎 Paste</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">👁️ VIEW</div>
                    <div class="menu-item" data-action="zoomIn">🔍 Zoom In</div>
                    <div class="menu-item" data-action="zoomOut">🔍 Zoom Out</div>
                    <div class="menu-item" data-action="fullscreen">🖥️ Full Screen</div>
                    <div class="menu-item" data-action="refresh">🔄 Refresh</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">🗺️ LAYER</div>
                    <div class="menu-item" data-action="addLayer">➕ Add Layer</div>
                    <div class="menu-item" data-action="removeLayer">➖ Remove Layer</div>
                    <div class="menu-item" data-action="layerProperties">⚙️ Layer Properties</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">⚙️ SETTINGS</div>
                    <div class="menu-item" data-action="options">🎛️ Options</div>
                    <div class="menu-item" data-action="projectProperties">📋 Project Properties</div>
                    <div class="menu-item" data-action="postgis">🗄️ PostGIS Connection</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">🧩 PLUGINS</div>
                    <div class="menu-item" data-action="pluginManager">🔌 Plugin Manager</div>
                    <div class="menu-item" data-action="pythonConsole">🐍 Python Console</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">📐 VECTOR</div>
                    <div class="menu-item" data-action="geometryTools">📐 Geometry Tools</div>
                    <div class="menu-item" data-action="analysisTools">📊 Analysis Tools</div>
                    <div class="menu-item" data-action="geoprocessing">🔄 Geoprocessing</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">🖼️ RASTER</div>
                    <div class="menu-item" data-action="rasterAnalysis">📈 Analysis</div>
                    <div class="menu-item" data-action="georeferencer">🗺️ Georeferencer</div>
                </div>
                <div class="menu-section">
                    <div class="menu-section-title">💾 DATABASES</div>
                    <div class="menu-item" data-action="dbManager">🗄️ DB Manager</div>
                    <div class="menu-item" data-action="importLayer">📥 Import Layer</div>
                    <div class="menu-item" data-action="exportLayer">📤 Export Layer</div>
                    <div class="menu-item" data-action="runSQL">📝 Run SQL Query</div>
                </div>
            </div>
        </div>
    `;
}

// Render the layer list (goes in left panel)
function renderLayerList() {
    if (availableLayers.length === 0) {
        return '<div class="layer-item">No layers added</div>';
    }
    
    return availableLayers.map(layer => `
        <div class="layer-item" data-layer-id="${layer.id}">
            <input type="checkbox" class="layer-checkbox" data-layer-id="${layer.id}" ${layer.visible ? 'checked' : ''}>
            <span class="layer-name">${layer.type === 'point' ? '📍' : layer.type === 'line' ? '📏' : '🔷'} ${layer.tableName}</span>
            <div class="layer-controls">
                <button class="layer-zoom" data-layer-id="${layer.id}" title="Zoom to layer">🔍</button>
                <button class="layer-style" data-layer-id="${layer.id}" title="Change style">🎨</button>
                <button class="layer-remove" data-layer-id="${layer.id}" title="Remove layer">✖️</button>
            </div>
        </div>
    `).join('');
}

// Full render for left panel section
function render() {
    return `
        <div class="section">
            <h3>🗺️ MAP LAYERS</h3>
            <div id="layer-list" class="layer-list">
                ${renderLayerList()}
            </div>
            <button id="addLayerBtn" class="add-layer-btn">+ ADD POSTGIS LAYER</button>
        </div>
    `;
}

// ============================================
// LAYER MANAGEMENT FUNCTIONS (with backend)
// ============================================

// Toggle layer visibility – load or clear from map
async function toggleLayer(layerId, visible) {
    layerVisibility[layerId] = visible;
    const layer = availableLayers.find(l => l.id === layerId);
    if (layer) layer.visible = visible;
    
    if (visible) {
        await loadLayerFromAPI(layerId);
    } else {
        clearLayerFromMap(layerId);
    }
}

async function loadLayerFromAPI(layerId) {
    const layer = availableLayers.find(l => l.id === layerId);
    if (!layer) return;
    
    const url = `${API_BASE_URL}${layer.apiEndpoint}`;
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        switch (layerId) {
            case 'manholes':
                // Manholes from /api/manholes/list (flat array)
                if (MapView && MapView.loadManholes) {
                    MapView.loadManholes(data);
                }
                break;
            case 'pipelines':
                // Pipelines from /api/pipelines/geojson (GeoJSON)
                if (MapView && MapView.loadPipelinesFromGeoJSON) {
                    MapView.loadPipelinesFromGeoJSON(data);
                }
                break;
            case 'suburbs':
                // Suburbs from /api/suburbs (GeoJSON)
                if (MapView && MapView.loadSuburbsFromGeoJSON) {
                    MapView.loadSuburbsFromGeoJSON(data);
                }
                break;
            default:
                console.warn('Unknown layer type', layerId);
        }
        layerLoaded[layerId] = true;
    } catch (error) {
        console.error(`Failed to load layer ${layerId}:`, error);
        layerLoaded[layerId] = false;
    }
}

function clearLayerFromMap(layerId) {
    switch (layerId) {
        case 'manholes':
            if (MapView && MapView.loadManholes) {
                MapView.loadManholes([]);
            }
            break;
        case 'pipelines':
            if (MapView && MapView.clearPipelines) {
                MapView.clearPipelines();
            }
            break;
        case 'suburbs':
            if (MapView && MapView.clearSuburbs) {
                MapView.clearSuburbs();
            }
            break;
        default:
            break;
    }
    layerLoaded[layerId] = false;
}

// Refresh all layers that are currently visible
async function refreshVisibleLayers() {
    const visibleLayers = availableLayers.filter(l => l.visible);
    for (const layer of visibleLayers) {
        await loadLayerFromAPI(layer.id);
    }
}

// Add a new PostGIS layer from a table name (simplified for now)
async function addPostGISLayer(tableName) {
    const layerId = tableName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    
    // Avoid duplicates
    if (availableLayers.some(l => l.id === layerId)) {
        alert(`Layer "${tableName}" already added.`);
        return;
    }
    
    // Determine type based on table name heuristics (user can change later)
    let type = 'point';
    let apiEndpoint = '/assets?asset_type=custom';
    
    const newLayer = {
        id: layerId,
        tableName: tableName,
        type: type,
        visible: true,
        color: '#3399ff',
        apiEndpoint: apiEndpoint
    };
    
    availableLayers.push(newLayer);
    layerVisibility[layerId] = true;
    refreshLayerList();
    
    alert(`Layer "${tableName}" added. You may need to implement custom API endpoint for full functionality.`);
}

// Update the layer list UI and reattach events
function refreshLayerList() {
    const layerList = document.getElementById('layer-list');
    if (layerList) {
        layerList.innerHTML = renderLayerList();
        attachLayerEvents();
    }
}

function attachLayerEvents() {
    // Checkbox events
    document.querySelectorAll('.layer-checkbox').forEach(cb => {
        cb.addEventListener('change', async function() {
            const layerId = this.dataset.layerId;
            await toggleLayer(layerId, this.checked);
        });
    });
    
    // Zoom buttons
    document.querySelectorAll('.layer-zoom').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const layerId = btn.dataset.layerId;
            await zoomToLayer(layerId);
            e.stopPropagation();
        });
    });
    
    // Style buttons
    document.querySelectorAll('.layer-style').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const layerId = btn.dataset.layerId;
            changeLayerStyle(layerId);
            e.stopPropagation();
        });
    });
    
    // Remove buttons
    document.querySelectorAll('.layer-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const layerId = btn.dataset.layerId;
            removeLayer(layerId);
            e.stopPropagation();
        });
    });
    
    // Add layer button
    const addLayerBtn = document.getElementById('addLayerBtn');
    if (addLayerBtn) {
        addLayerBtn.removeEventListener('click', openAddLayerDialog);
        addLayerBtn.addEventListener('click', openAddLayerDialog);
    }
}

async function zoomToLayer(layerId) {
    const map = MapView.getMap();
    if (!map) return;
    
    // For now, just fit to current markers or default view
    // In a full implementation, you'd fetch the layer's extent
    alert(`Zoom to ${layerId} - Feature coming soon`);
}

function changeLayerStyle(layerId) {
    const newColor = prompt('Enter color (hex code or name):', '#28a745');
    if (newColor) {
        const layer = availableLayers.find(l => l.id === layerId);
        if (layer) {
            layer.color = newColor;
            alert(`Style for ${layerId} changed to ${newColor}`);
            if (layer.visible) {
                loadLayerFromAPI(layerId);
            }
        }
    }
}

function removeLayer(layerId) {
    if (confirm(`Remove layer "${layerId}" from map?`)) {
        const index = availableLayers.findIndex(l => l.id === layerId);
        if (index !== -1) {
            availableLayers.splice(index, 1);
            delete layerVisibility[layerId];
            clearLayerFromMap(layerId);
            refreshLayerList();
        }
    }
}

function openAddLayerDialog() {
    const tableName = prompt('Enter PostGIS table name (e.g., roads, catchments):');
    if (tableName && tableName.trim()) {
        addPostGISLayer(tableName.trim());
    }
}

// ============================================
// MENU ACTIONS
// ============================================

function initMenuDropdown() {
    const menuBtn = document.getElementById('menuIconBtn');
    const dropdown = document.getElementById('menuDropdown');
    
    if (!menuBtn || !dropdown) return;
    
    menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
    });
    
    document.addEventListener('click', function(e) {
        if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
    
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const action = item.dataset.action;
            handleMenuAction(action);
            dropdown.style.display = 'none';
        });
    });
}

async function handleMenuAction(action) {
    console.log('Menu action:', action);
    const map = MapView.getMap();
    switch(action) {
        case 'newProject':
            if(confirm('Create new project? Unsaved changes will be lost.')) resetProject();
            break;
        case 'saveProject':
            saveProject();
            break;
        case 'openProject':
            openProject();
            break;
        case 'exportMap':
            alert('Export map as image (feature coming soon)');
            break;
        case 'printLayout':
            window.print();
            break;
        case 'fullscreen':
            toggleFullScreen();
            break;
        case 'addLayer':
            openAddLayerDialog();
            break;
        case 'postgis':
            alert('PostGIS connection settings – modify .env on backend');
            break;
        case 'zoomIn':
            if (map) map.zoomIn();
            break;
        case 'zoomOut':
            if (map) map.zoomOut();
            break;
        case 'refresh':
            await refreshVisibleLayers();
            break;
        default:
            alert(`Action: ${action} (Coming soon)`);
    }
}

// ============================================
// PROJECT SAVE/LOAD (using localStorage)
// ============================================

function resetProject() {
    availableLayers = [
        { id: 'manholes', tableName: 'waste_water_manhole', type: 'point', visible: true, color: '#9b59b6', apiEndpoint: '/manholes/list' },
        { id: 'pipelines', tableName: 'waste_water_pipeline', type: 'line', visible: true, color: '#32cd32', apiEndpoint: '/pipelines/geojson' },
        { id: 'suburbs', tableName: 'suburbs', type: 'polygon', visible: false, color: '#000000', apiEndpoint: '/suburbs' }
    ];
    layerVisibility = { manholes: true, pipelines: true, suburbs: false };
    refreshLayerList();
    refreshVisibleLayers();
    alert('Project reset to default');
}

function saveProject() {
    const project = { 
        layers: availableLayers, 
        visibility: layerVisibility, 
        savedAt: new Date().toISOString() 
    };
    localStorage.setItem('sewer_project', JSON.stringify(project));
    alert('Project saved!');
}

function openProject() {
    const saved = localStorage.getItem('sewer_project');
    if (saved) {
        const project = JSON.parse(saved);
        availableLayers = project.layers;
        layerVisibility = project.visibility;
        refreshLayerList();
        refreshVisibleLayers();
        alert('Project loaded!');
    } else {
        alert('No saved project found');
    }
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ============================================
// INITIALIZATION
// ============================================

function initLayerManager() {
    refreshLayerList();
    initMenuDropdown();
    setTimeout(() => {
        refreshVisibleLayers();
    }, 500);
}

// ============================================
// GETTERS (for external use)
// ============================================

function getLayerVisibility() {
    return layerVisibility;
}

function getAvailableLayers() {
    return availableLayers;
}

// ============================================
// EXPORTS
// ============================================

export default {
    render: render,
    renderMenuIcon: renderMenuIcon,
    init: initLayerManager,
    getLayerVisibility: getLayerVisibility,
    getAvailableLayers: getAvailableLayers,
    toggleLayer: toggleLayer,
    refreshVisibleLayers: refreshVisibleLayers
};