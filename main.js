// main.js - Main orchestrator for Mutare Sewer Dashboard
// Connects to Python Flask backend on port 5000

import Header from './components/header.js';
import Filters from './components/filters.js';
import LayerManager from './components/layermanager.js';
import MapView from './components/mapview.js';
import Statistics from './components/statistics.js';
import Hotspots from './components/hotspots.js';
import Reports from './components/reports.js';
import ReportProcessor from './components/reportprocessor.js';
import Identification from './components/identification.js';  // ADDED: Identification component

// ============================================
// API CONFIGURATION – PYTHON BACKEND
// ============================================
const API_BASE_URL = 'http://localhost:5000/api';

console.log('Imports loaded:', {
    Header: !!Header,
    Filters: !!Filters,
    LayerManager: !!LayerManager,
    MapView: !!MapView,
    Statistics: !!Statistics,
    Hotspots: !!Hotspots,
    Reports: !!Reports,
    ReportProcessor: !!ReportProcessor,
    Identification: !!Identification
});

// ============================================
// RENDER ALL COMPONENTS
// ============================================

function renderComponents() {
    console.log('Rendering components...');
    
    const headerContainer = document.getElementById('header-container');
    if (headerContainer && Header && Header.render) {
        headerContainer.innerHTML = Header.render();
        console.log('Header rendered');
    }
    
    const layermanagerContainer = document.getElementById('layermanager-container');
    if (layermanagerContainer && LayerManager && LayerManager.render) {
        layermanagerContainer.innerHTML = LayerManager.render();
        console.log('LayerManager rendered');
    }
    
    const filtersContainer = document.getElementById('filters-container');
    if (filtersContainer && Filters && Filters.render) {
        filtersContainer.innerHTML = Filters.render();
        console.log('Filters HTML rendered');
    } else {
        console.error('Filters container or render method not found!');
    }
    
    const reportProcessorContainer = document.getElementById('reportprocessor-container');
    if (reportProcessorContainer && ReportProcessor && ReportProcessor.render) {
        reportProcessorContainer.innerHTML = ReportProcessor.render();
        console.log('ReportProcessor rendered');
    } else {
        console.error('ReportProcessor container or render method not found!');
    }
    
    // ADDED: Identification container
    const identificationContainer = document.getElementById('identification-container');
    if (identificationContainer && Identification && Identification.render) {
        identificationContainer.innerHTML = Identification.render();
        console.log('Identification rendered');
    } else {
        console.warn('Identification container or render method not found!');
    }
    
    const toolbarContainer = document.getElementById('toolbar-container');
    if (toolbarContainer) {
        toolbarContainer.innerHTML = `
            <div class="toolbar">
                <div id="menu-container" class="toolbar-menu-container"></div>
                <button id="fitBoundsBtn" title="Fit map to all assets">🎯 FIT ALL</button>
                <button id="heatmapBtn" title="Show heatmap of blockages">🔥 SHOW HEATMAP</button>
                <button id="clearHeatmapBtn" title="Clear heatmap">❌ CLEAR HEATMAP</button>
                <button id="identifyBtn" title="Identify feature at mouse click">🔍 IDENTIFY</button>
                <button id="exportGeoJSONBtn" title="Export current view as GeoJSON">📎 EXPORT GEOJSON</button>
                <button id="printMapBtn" title="Print map">🖨️ PRINT MAP</button>
            </div>
        `;
    }
    
    const menuContainer = document.getElementById('menu-container');
    if (menuContainer && LayerManager && LayerManager.renderMenuIcon) {
        menuContainer.innerHTML = LayerManager.renderMenuIcon();
    }
    
    const mapContainer = document.getElementById('map-container');
    if (mapContainer && !document.getElementById('map')) {
        mapContainer.innerHTML = '<div id="map" style="height: 100%; width: 100%;"></div>';
    }
    
    const statusContainer = document.getElementById('status-container');
    if (statusContainer) {
        statusContainer.innerHTML = '<div class="status-bar"><span id="coordStatus">📍 Ready | Map loading...</span><span id="identifyStatus" style="margin-left: 20px;"></span></div>';
    }
    
    const statisticsContainer = document.getElementById('statistics-container');
    if (statisticsContainer && Statistics && Statistics.render) {
        statisticsContainer.innerHTML = Statistics.render();
    }
    
    const hotspotsContainer = document.getElementById('hotspots-container');
    if (hotspotsContainer && Hotspots && Hotspots.render) {
        hotspotsContainer.innerHTML = Hotspots.render();
    }
    
    const reportsContainer = document.getElementById('reports-container');
    if (reportsContainer && Reports && Reports.render) {
        reportsContainer.innerHTML = Reports.render();
    }
    
    console.log('Components rendered');
}

// ============================================
// DATA FETCHING (for components that need full datasets)
// ============================================

async function fetchAllManholes() {
    try {
        const res = await fetch(`${API_BASE_URL}/manholes_all`);
        if (!res.ok) throw new Error('Failed to fetch manholes');
        const geojson = await res.json();
        return geojson.features.map(f => ({
            ...f.properties,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            id: f.properties.manhole_id || f.properties.id,
            type: 'manhole'
        }));
    } catch (err) {
        console.error('fetchAllManholes error:', err);
        return [];
    }
}

async function fetchAllPipelines() {
    try {
        const res = await fetch(`${API_BASE_URL}/pipelines_all`);
        if (!res.ok) throw new Error('Failed to fetch pipelines');
        const geojson = await res.json();
        return geojson.features.map(f => ({
            ...f.properties,
            geometry: f.geometry,
            type: 'pipeline',
            lat: f.geometry.coordinates[0]?.[1] || f.geometry.coordinates[1], // approximate
            lng: f.geometry.coordinates[0]?.[0] || f.geometry.coordinates[0]
        }));
    } catch (err) {
        console.error('fetchAllPipelines error:', err);
        return [];
    }
}

async function fetchAllSuburbs() {
    try {
        const res = await fetch(`${API_BASE_URL}/suburbs_all`);
        if (!res.ok) throw new Error('Failed to fetch suburbs');
        const geojson = await res.json();
        return geojson.features.map(f => ({
            ...f.properties,
            geometry: f.geometry,
            type: 'suburb'
        }));
    } catch (err) {
        console.error('fetchAllSuburbs error:', err);
        return [];
    }
}

async function fetchAllJobs() {
    try {
        const res = await fetch(`${API_BASE_URL}/jobs_all`);
        if (!res.ok) return [];
        const geojson = await res.json();
        return geojson.features.map(f => ({
            ...f.properties,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            type: 'job'
        }));
    } catch (err) {
        console.warn('Job logs not available:', err);
        return [];
    }
}

async function fetchAllComplaints() {
    try {
        const res = await fetch(`${API_BASE_URL}/complaints_all`);
        if (!res.ok) return [];
        const geojson = await res.json();
        return geojson.features.map(f => ({
            ...f.properties,
            lat: f.geometry.coordinates[1],
            lng: f.geometry.coordinates[0],
            type: 'complaint'
        }));
    } catch (err) {
        console.warn('Complaints not available:', err);
        return [];
    }
}

// ============================================
// INITIALIZE ALL COMPONENTS
// ============================================

async function initComponents() {
    console.log('Initializing components...');
    
    // 1. Map – will automatically fetch bbox-filtered data
    if (MapView && typeof MapView.init === 'function') {
        console.log('Initializing map...');
        const map = MapView.init(-18.9735, 32.6705, 13);
        if (map) {
            console.log('Map initialized, data will load automatically');
        } else {
            console.error('Map initialization failed');
        }
    } else {
        console.error('MapView.init is not a function!', MapView);
    }
    
    // 2. Filters (requires data from backend for dropdowns)
    if (Filters && typeof Filters.init === 'function') {
        console.log('Initializing filters...');
        Filters.init();
    } else {
        console.error('Filters.init is not a function!', Filters);
    }
    
    // 3. Report Processor
    if (ReportProcessor && typeof ReportProcessor.init === 'function') {
        console.log('Initializing report processor...');
        ReportProcessor.init();
    } else {
        console.error('ReportProcessor.init is not a function!', ReportProcessor);
    }
    
    // 4. Layer Manager
    if (LayerManager && typeof LayerManager.init === 'function') {
        console.log('Initializing layer manager...');
        LayerManager.init();
    } else {
        console.error('LayerManager.init is not a function!', LayerManager);
    }
    
    // 5. Statistics
    if (Statistics && typeof Statistics.init === 'function') {
        console.log('Initializing statistics...');
        await Statistics.init();
    }
    
    // 6. Hotspots
    if (Hotspots && typeof Hotspots.init === 'function') {
        console.log('Initializing hotspots...');
        Hotspots.init();
        const manholes = await fetchAllManholes();
        if (Hotspots.update) Hotspots.update(manholes);
    }
    
    // 7. Reports
    if (Reports && typeof Reports.init === 'function') {
        console.log('Initializing reports...');
        await Reports.init();
    }
    
    // 8. Identification - NEW: Initialize with all data
    if (Identification && typeof Identification.init === 'function') {
        console.log('Initializing identification component...');
        
        // Fetch all datasets for identification
        const [manholes, pipelines, suburbs, jobs, complaints] = await Promise.all([
            fetchAllManholes(),
            fetchAllPipelines(),
            fetchAllSuburbs(),
            fetchAllJobs(),
            fetchAllComplaints()
        ]);
        
        // Set data for identification
        if (Identification.setData) {
            Identification.setData(manholes, pipelines, suburbs, jobs, complaints);
        }
        
        // Initialize with map reference
        const map = MapView.getMap();
        if (map && Identification.init) {
            Identification.init(map);
        }
        
        console.log(`Identification data loaded: ${manholes.length} manholes, ${pipelines.length} pipelines, ${suburbs.length} suburbs, ${jobs.length} jobs, ${complaints.length} complaints`);
    } else {
        console.error('Identification component not available!');
    }
    
    console.log('All components initialized');
}

// ============================================
// TOOLBAR EVENT LISTENERS
// ============================================

function setupEventListeners() {
    const fitBoundsBtn = document.getElementById('fitBoundsBtn');
    if (fitBoundsBtn) {
        fitBoundsBtn.addEventListener('click', () => {
            if (MapView && MapView.fitToBounds) MapView.fitToBounds();
        });
    }
    
    const heatmapBtn = document.getElementById('heatmapBtn');
    if (heatmapBtn) {
        heatmapBtn.addEventListener('click', async () => {
            const manholes = await fetchAllManholes();
            if (MapView && MapView.showHeatmapFromManholes) {
                MapView.showHeatmapFromManholes(manholes);
            }
        });
    }
    
    const clearHeatmapBtn = document.getElementById('clearHeatmapBtn');
    if (clearHeatmapBtn) {
        clearHeatmapBtn.addEventListener('click', () => {
            if (MapView && MapView.clearHeatmap) MapView.clearHeatmap();
        });
    }
    
    // NEW: Identify button toggles identification mode
    const identifyBtn = document.getElementById('identifyBtn');
    let identifyMode = false;
    if (identifyBtn && Identification && Identification.enableIdentifyMode) {
        identifyBtn.addEventListener('click', () => {
            identifyMode = !identifyMode;
            if (identifyMode) {
                Identification.enableIdentifyMode(true);
                identifyBtn.style.background = '#28a745';
                identifyBtn.style.color = 'white';
                identifyBtn.title = 'Click on map to identify features (Active)';
                const identifyStatus = document.getElementById('identifyStatus');
                if (identifyStatus) identifyStatus.innerHTML = '🔍 Identify mode ON - click on any feature';
            } else {
                Identification.enableIdentifyMode(false);
                identifyBtn.style.background = '';
                identifyBtn.style.color = '';
                identifyBtn.title = 'Click to identify features on map';
                const identifyStatus = document.getElementById('identifyStatus');
                if (identifyStatus) identifyStatus.innerHTML = '';
            }
        });
    }
    
    const printMapBtn = document.getElementById('printMapBtn');
    if (printMapBtn) {
        printMapBtn.addEventListener('click', () => window.print());
    }
    
    const exportGeoJSONBtn = document.getElementById('exportGeoJSONBtn');
    if (exportGeoJSONBtn && Identification && Identification.exportToGeoJSON) {
        exportGeoJSONBtn.addEventListener('click', () => {
            Identification.exportToGeoJSON();
        });
    } else if (exportGeoJSONBtn) {
        exportGeoJSONBtn.addEventListener('click', () => {
            alert('GeoJSON export: will export current view data');
        });
    }
    
    // Base map selector
    document.addEventListener('change', function(e) {
        if (e.target && e.target.id === 'baseMapSelect') {
            if (MapView && MapView.switchBaseMap) MapView.switchBaseMap(e.target.value);
        }
    });
    
    // Listen for filter changes
    document.addEventListener('filtersChanged', async (event) => {
        console.log('Filters changed:', event.detail);
        const manholes = await fetchAllManholes();
        const pipelines = await fetchAllPipelines();
        
        if (Hotspots && Hotspots.update) Hotspots.update(manholes);
        if (Statistics && Statistics.update) Statistics.update();
        
        // Update identification data with filtered results
        if (Identification && Identification.setData) {
            const suburbs = await fetchAllSuburbs();
            const jobs = await fetchAllJobs();
            const complaints = await fetchAllComplaints();
            Identification.setData(manholes, pipelines, suburbs, jobs, complaints);
        }
    });
    
    // Zoom to location (from hotspots, identification)
    document.addEventListener('zoomToLocation', (event) => {
        const { lat, lng, zoom } = event.detail;
        if (MapView && MapView.getMap) {
            const map = MapView.getMap();
            if (map && map.setView) map.setView([lat, lng], zoom || 18);
        }
    });
    
    // Layer toggled event
    document.addEventListener('layerToggled', async (event) => {
        console.log(`Layer ${event.detail.layerId} toggled: ${event.detail.visible}`);
    });
    
    // Data refreshed event
    document.addEventListener('dataRefreshed', async () => {
        console.log('Data refreshed, updating identification...');
        const [manholes, pipelines, suburbs, jobs, complaints] = await Promise.all([
            fetchAllManholes(),
            fetchAllPipelines(),
            fetchAllSuburbs(),
            fetchAllJobs(),
            fetchAllComplaints()
        ]);
        if (Identification && Identification.setData) {
            Identification.setData(manholes, pipelines, suburbs, jobs, complaints);
        }
    });
    
    // Map data refreshed event
    document.addEventListener('mapDataRefreshed', (event) => {
        console.log('Map data refreshed:', event.detail);
    });
    
    // Map ready event
    document.addEventListener('mapReady', () => {
        console.log('Map ready event received');
        const identifyStatus = document.getElementById('identifyStatus');
        if (identifyStatus) identifyStatus.innerHTML = '✅ Map ready - Click 🔍 to identify features';
        setTimeout(() => {
            if (identifyStatus && identifyStatus.innerHTML === '✅ Map ready - Click 🔍 to identify features') {
                identifyStatus.innerHTML = '';
            }
        }, 3000);
    });
    
    // ============================================
    // ADDED: Show Complaint Buffers Event Listener
    // ============================================
    document.addEventListener('showComplaintBuffers', (event) => {
        console.log('Received showComplaintBuffers event:', event.detail);
        if (MapView && MapView.showComplaintsWithBuffers) {
            MapView.showComplaintsWithBuffers(event.detail.complaints, event.detail.reportDate);
        } else {
            console.warn('MapView.showComplaintsWithBuffers not available');
        }
    });
}

// ============================================
// MAIN INIT
// ============================================

async function init() {
    console.log('Initializing Mutare Sewer Dashboard...');
    
    if (typeof L === 'undefined') {
        console.error('Leaflet (L) is not loaded!');
        alert('Leaflet library not found. Please check network.');
        return;
    }
    
    renderComponents();
    await initComponents();
    setupEventListeners();
    
    console.log('Dashboard ready! Backend API:', API_BASE_URL);
}

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}