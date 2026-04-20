// components/layermanager.js - Layer Manager Component (QGIS Style)

// Available layers configuration
let availableLayers = [
    { id: 'manholes', name: 'waste_water_manhole', type: 'point', visible: true, color: '#28a745' },
    { id: 'pipelines', name: 'waste_water_pipeline', type: 'line', visible: true, color: '#2b7bff' },
    { id: 'suburbs', name: 'suburbs_boundary', type: 'polygon', visible: false, color: '#ffc107' },
    { id: 'roads', name: 'roads_access', type: 'line', visible: false, color: '#aaaaaa' }
];

let layerVisibility = {
    manholes: true,
    pipelines: true,
    suburbs: false,
    roads: false
};

// ============================================
// QGIS MENU BAR
// ============================================

function initQGISMenu() {
    const menuConfig = [
        { name: 'Project', items: ['New Project', 'Open Project', 'Save Project', 'Save As', 'Export Map', 'Print Layout', 'Exit'] },
        { name: 'Edit', items: ['Undo', 'Redo', 'Cut', 'Copy', 'Paste', 'Delete Selected', 'Select All'] },
        { name: 'View', items: ['Zoom In', 'Zoom Out', 'Pan', 'Full Screen', 'Refresh', 'Show/Hide Panels'] },
        { name: 'Layer', items: ['Add Layer', 'Remove Layer', 'Duplicate Layer', 'Layer Properties', 'Set CRS', 'Export Layer'] },
        { name: 'Settings', items: ['Options', 'Project Properties', 'Custom CRS', 'Snapping Options', 'Authentication'] },
        { name: 'Plugins', items: ['Manage Plugins', 'Python Console', 'Plugin Manager', 'Install from ZIP'] },
        { name: 'Vector', items: ['Geometry Tools', 'Analysis Tools', 'Research Tools', 'Geoprocessing', 'Data Management'] },
        { name: 'Raster', items: ['Analysis', 'Extraction', 'Conversion', 'Georeferencer', 'Align Raster'] },
        { name: 'Databases', items: ['DB Manager', 'Import Layer', 'Export Layer', 'Run SQL Query', 'PostGIS Connection'] }
    ];
    
    const menuBar = document.getElementById('qgis-menu-bar');
    if (!menuBar) return;
    
    menuBar.innerHTML = '';
    
    for (let i = 0; i < menuConfig.length; i++) {
        const menu = menuConfig[i];
        const menuDiv = document.createElement('div');
        menuDiv.className = 'menu-item';
        menuDiv.textContent = menu.name;
        
        const dropdown = document.createElement('div');
        dropdown.className = 'dropdown-menu';
        
        for (let j = 0; j < menu.items.length; j++) {
            const item = document.createElement('div');
            item.className = 'dropdown-item';
            item.textContent = menu.items[j];
            item.addEventListener('click', (function(menuName, itemName) {
                return function() { handleMenuClick(menuName, itemName); };
            })(menu.name, menu.items[j]));
            dropdown.appendChild(item);
        }
        
        menuDiv.appendChild(dropdown);
        menuBar.appendChild(menuDiv);
    }
}

// Handle menu clicks
function handleMenuClick(menu, item) {
    console.log('Menu clicked:', menu, '->', item);
    
    switch(item) {
        case 'New Project':
            if(confirm('Create new project? Unsaved changes will be lost.')) {
                resetProject();
            }
            break;
        case 'Save Project':
            saveProject();
            break;
        case 'Open Project':
            openProject();
            break;
        case 'Export Map':
            exportMapAsImage();
            break;
        case 'Print Layout':
            window.print();
            break;
        case 'Full Screen':
            toggleFullScreen();
            break;
        case 'Add Layer':
            openAddLayerDialog();
            break;
        case 'PostGIS Connection':
            alert('Connect to PostgreSQL/PostGIS database');
            break;
        default:
            alert(menu + ' -> ' + item + ' (Coming soon)');
    }
}

// ============================================
// LAYER MANAGER FUNCTIONS
// ============================================

function renderLayerList() {
    const layerList = document.getElementById('layer-list');
    if (!layerList) return;
    
    const layersHtml = availableLayers.map(layer => `
        <div class="layer-item" data-layer="${layer.id}">
            <input type="checkbox" class="layer-checkbox" data-layer="${layer.id}" ${layer.visible ? 'checked' : ''}>
            <span class="layer-name">${layer.type === 'point' ? '📍' : layer.type === 'line' ? '📏' : '🔷'} ${layer.name}</span>
            <div class="layer-controls">
                <button class="layer-zoom" data-layer="${layer.id}" title="Zoom to layer">🔍</button>
                <button class="layer-style" data-layer="${layer.id}" title="Change style">🎨</button>
                <button class="layer-remove" data-layer="${layer.id}" title="Remove layer">✖️</button>
            </div>
        </div>
    `).join('');
    
    layerList.innerHTML = layersHtml;
    attachLayerEvents();
}

function attachLayerEvents() {
    // Checkbox events
    const checkboxes = document.querySelectorAll('.layer-checkbox');
    checkboxes.forEach(cb => {
        cb.addEventListener('change', function() {
            const layerId = this.dataset.layer;
            toggleLayer(layerId, this.checked);
        });
    });
    
    // Zoom buttons
    const zoomBtns = document.querySelectorAll('.layer-zoom');
    zoomBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const layerId = this.dataset.layer;
            zoomToLayer(layerId);
            e.stopPropagation();
        });
    });
    
    // Style buttons
    const styleBtns = document.querySelectorAll('.layer-style');
    styleBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const layerId = this.dataset.layer;
            changeLayerStyle(layerId);
            e.stopPropagation();
        });
    });
    
    // Remove buttons
    const removeBtns = document.querySelectorAll('.layer-remove');
    removeBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const layerId = this.dataset.layer;
            removeLayer(layerId);
            e.stopPropagation();
        });
    });
}

function toggleLayer(layerId, visible) {
    layerVisibility[layerId] = visible;
    for (let i = 0; i < availableLayers.length; i++) {
        if (availableLayers[i].id === layerId) {
            availableLayers[i].visible = visible;
            break;
        }
    }
    
    // Dispatch event for map to update
    const event = new CustomEvent('layerToggled', {
        detail: { layerId, visible }
    });
    document.dispatchEvent(event);
}

function zoomToLayer(layerId) {
    alert(`Zoom to ${layerId} layer - Will zoom to extent of features`);
    // In production, this would get bounds from the layer data
}

function changeLayerStyle(layerId) {
    const newColor = prompt('Enter color (hex code or name):', '#28a745');
    if (newColor) {
        for (let i = 0; i < availableLayers.length; i++) {
            if (availableLayers[i].id === layerId) {
                availableLayers[i].color = newColor;
                break;
            }
        }
        alert(`Style for ${layerId} changed to ${newColor}`);
        // Dispatch event to update map styling
        const event = new CustomEvent('layerStyleChanged', {
            detail: { layerId, color: newColor }
        });
        document.dispatchEvent(event);
    }
}

function removeLayer(layerId) {
    if (confirm(`Remove layer "${layerId}" from map?`)) {
        // Remove from array
        const index = availableLayers.findIndex(l => l.id === layerId);
        if (index !== -1) {
            availableLayers.splice(index, 1);
        }
        delete layerVisibility[layerId];
        
        // Re-render layer list
        renderLayerList();
        
        // Dispatch event to remove from map
        const event = new CustomEvent('layerRemoved', {
            detail: { layerId }
        });
        document.dispatchEvent(event);
    }
}

function openAddLayerDialog() {
    const layerName = prompt('Enter PostGIS table name:', 'waste_water_manhole');
    if (layerName) {
        const layerId = layerName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const newLayer = {
            id: layerId,
            name: layerName,
            type: 'point',
            visible: true,
            color: '#28a745'
        };
        availableLayers.push(newLayer);
        layerVisibility[layerId] = true;
        renderLayerList();
        
        alert(`Layer "${layerName}" added. Connect to PostgreSQL to load data.`);
    }
}

function getLayerVisibility() {
    return layerVisibility;
}

function getAvailableLayers() {
    return availableLayers;
}

// ============================================
// PROJECT FUNCTIONS
// ============================================

function resetProject() {
    // Reset to default layers
    availableLayers = [
        { id: 'manholes', name: 'waste_water_manhole', type: 'point', visible: true, color: '#28a745' },
        { id: 'pipelines', name: 'waste_water_pipeline', type: 'line', visible: true, color: '#2b7bff' },
        { id: 'suburbs', name: 'suburbs_boundary', type: 'polygon', visible: false, color: '#ffc107' }
    ];
    layerVisibility = {
        manholes: true,
        pipelines: true,
        suburbs: false
    };
    renderLayerList();
    
    const event = new CustomEvent('projectReset');
    document.dispatchEvent(event);
    alert('Project reset to default');
}

function saveProject() {
    const project = {
        layers: availableLayers,
        visibility: layerVisibility,
        savedAt: new Date().toISOString()
    };
    localStorage.setItem('sewer_project', JSON.stringify(project));
    alert('Project saved successfully!');
}

function openProject() {
    const saved = localStorage.getItem('sewer_project');
    if (saved) {
        try {
            const project = JSON.parse(saved);
            availableLayers = project.layers;
            layerVisibility = project.visibility;
            renderLayerList();
            
            const event = new CustomEvent('projectLoaded', {
                detail: project
            });
            document.dispatchEvent(event);
            alert('Project loaded successfully!');
        } catch (e) {
            alert('Error loading project');
        }
    } else {
        alert('No saved project found');
    }
}

function exportMapAsImage() {
    alert('Export map as image - Will capture current map view');
    // In production, this would use html2canvas to capture the map
}

function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// ============================================
// BASE MAP SWITCHER
// ============================================

function initBaseMapSwitcher() {
    const baseMapSelect = document.getElementById('baseMapSelect');
    if (baseMapSelect) {
        baseMapSelect.addEventListener('change', function(e) {
            const event = new CustomEvent('baseMapChanged', {
                detail: { tileType: e.target.value }
            });
            document.dispatchEvent(event);
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

function initLayerManager() {
    renderLayerList();
    initQGISMenu();
    initBaseMapSwitcher();
}

// ============================================
// EXPORTS
// ============================================

export default {
    render: renderLayerList,
    init: initLayerManager,
    getLayerVisibility: getLayerVisibility,
    getAvailableLayers: getAvailableLayers,
    toggleLayer: toggleLayer
};
