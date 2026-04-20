// ============================================
// MUTARE SEWER ENGINEERING DASHBOARD
// FOREST GREEN THEME - FULL FUNCTIONALITY
// ============================================

// API Configuration (change to your backend URL when deployed)
const API_URL = 'https://mutare-backend.onrender.com/api';

// Global variables
let map;
let drawnItems;
let currentMarkers = [];
let heatLayer = null;
let jobsChart, suburbChart;
let addedLayers = {};

// Current filters
let currentFilters = {
    suburb: 'all',
    diameter: 'all',
    material: 'all',
    status: 'all'
};

// Mock data (replace with actual API calls)
const allAssets = [
    { id: 1, code: 'MH-001', type: 'manhole', suburb: 'CBD', diameter: 150, material: 'concrete', lat: -18.9735, lng: 32.6705, blockages: 12, status: 'critical', lastJob: '2026-04-15' },
    { id: 2, code: 'MH-002', type: 'manhole', suburb: 'Sakubva', diameter: 100, material: 'PVC', lat: -18.9750, lng: 32.6720, blockages: 5, status: 'warning', lastJob: '2026-04-12' },
    { id: 3, code: 'PP-001', type: 'pipe', suburb: 'CBD', diameter: 200, material: 'concrete', lat: -18.9720, lng: 32.6680, blockages: 8, status: 'warning', lastJob: '2026-04-08' },
    { id: 4, code: 'MH-003', type: 'manhole', suburb: 'Dangamvura', diameter: 80, material: 'asbestos', lat: -18.9780, lng: 32.6750, blockages: 3, status: 'good', lastJob: '2026-04-01' },
    { id: 5, code: 'MH-004', type: 'manhole', suburb: 'CBD', diameter: 120, material: 'concrete', lat: -18.9700, lng: 32.6660, blockages: 15, status: 'critical', lastJob: '2026-04-14' },
    { id: 6, code: 'PP-002', type: 'pipe', suburb: 'Sakubva', diameter: 90, material: 'clay', lat: -18.9770, lng: 32.6730, blockages: 2, status: 'good', lastJob: '2026-03-28' },
    { id: 7, code: 'MH-005', type: 'manhole', suburb: 'Chikanga', diameter: 130, material: 'concrete', lat: -18.9650, lng: 32.6600, blockages: 7, status: 'warning', lastJob: '2026-04-10' }
];

// Job logs
const jobLogs = [
    { asset_id: 1, type: 'unblocking', date: '2026-04-15', operator: 'John', suburb: 'CBD' },
    { asset_id: 1, type: 'inspection', date: '2026-04-10', operator: 'Mary', suburb: 'CBD' },
    { asset_id: 2, type: 'unblocking', date: '2026-04-12', operator: 'John', suburb: 'Sakubva' },
    { asset_id: 3, type: 'repair', date: '2026-04-08', operator: 'Peter', suburb: 'CBD' },
    { asset_id: 5, type: 'unblocking', date: '2026-04-14', operator: 'Mary', suburb: 'CBD' },
    { asset_id: 5, type: 'unblocking', date: '2026-04-07', operator: 'John', suburb: 'CBD' },
    { asset_id: 7, type: 'inspection', date: '2026-04-10', operator: 'Peter', suburb: 'Chikanga' }
];

// ============================================
// INITIALIZATION
// ============================================
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initFilters();
    loadMarkers(allAssets);
    initCharts();
    updateSummary(allAssets);
    updateProblemAssets(allAssets);
    setupEventListeners();
});

// ============================================
// MAP INITIALIZATION
// ============================================
function initMap() {
    map = L.map('map').setView([-18.9735, 32.6705], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: 'OpenStreetMap | Mutare Sewer Dashboard',
        subdomains: 'abcd',
        maxZoom: 19
    }).addTo(map);
    
    // Scale bar
    L.control.scale({ metric: true, imperial: false, position: 'bottomleft' }).addTo(map);
    
    // Mouse position tracking
    map.on('mousemove', (e) => {
        document.getElementById('coordStatus').innerHTML = 
            `LAT: ${e.latlng.lat.toFixed(5)} | LNG: ${e.latlng.lng.toFixed(5)} | ZOOM: ${map.getZoom()}`;
    });
    
    // Draw control
    drawnItems = L.featureGroup().addTo(map);
}

// ============================================
// FILTER LOGIC (CLICK ONLY)
// ============================================
function initFilters() {
    // Suburb filters
    document.querySelectorAll('#suburbFilters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilters.suburb = btn.dataset.suburb;
            updateFilterUI();
            applyFilters();
        });
    });
    
    // Diameter filters
    document.querySelectorAll('#diameterFilters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilters.diameter = btn.dataset.diameter;
            updateFilterUI();
            applyFilters();
        });
    });
    
    // Material filters
    document.querySelectorAll('#materialFilters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilters.material = btn.dataset.material;
            updateFilterUI();
            applyFilters();
        });
    });
    
    // Status filters
    document.querySelectorAll('#statusFilters .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            currentFilters.status = btn.dataset.status;
            updateFilterUI();
            applyFilters();
        });
    });
    
    // Clear all
    document.getElementById('clearAllFilters').addEventListener('click', () => {
        currentFilters = { suburb: 'all', diameter: 'all', material: 'all', status: 'all' };
        updateFilterUI();
        applyFilters();
    });
}

function updateFilterUI() {
    // Update active class on buttons
    document.querySelectorAll('#suburbFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.suburb === currentFilters.suburb);
    });
    document.querySelectorAll('#diameterFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.diameter === currentFilters.diameter);
    });
    document.querySelectorAll('#materialFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.material === currentFilters.material);
    });
    document.querySelectorAll('#statusFilters .filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.status === currentFilters.status);
    });
    
    // Show active filters
    const activeList = [];
    if (currentFilters.suburb !== 'all') activeList.push(`Suburb: ${currentFilters.suburb}`);
    if (currentFilters.diameter !== 'all') activeList.push(`Diameter: ${currentFilters.diameter}`);
    if (currentFilters.material !== 'all') activeList.push(`Material: ${currentFilters.material}`);
    if (currentFilters.status !== 'all') activeList.push(`Status: ${currentFilters.status}`);
    
    const activeDiv = document.getElementById('activeFilters');
    if (activeList.length === 0) {
        activeDiv.innerHTML = 'No active filters (showing all)';
    } else {
        activeDiv.innerHTML = activeList.join(' | ');
    }
}

function applyFilters() {
    const filtered = allAssets.filter(asset => {
        if (currentFilters.suburb !== 'all' && asset.suburb !== currentFilters.suburb) return false;
        if (currentFilters.diameter !== 'all') {
            if (currentFilters.diameter === 'small' && asset.diameter >= 100) return false;
            if (currentFilters.diameter === 'medium' && (asset.diameter < 100 || asset.diameter > 150)) return false;
            if (currentFilters.diameter === 'large' && asset.diameter <= 150) return false;
        }
        if (currentFilters.material !== 'all' && asset.material !== currentFilters.material) return false;
        if (currentFilters.status !== 'all' && asset.status !== currentFilters.status) return false;
        return true;
    });
    
    loadMarkers(filtered);
    updateCharts(filtered);
    updateSummary(filtered);
    updateProblemAssets(filtered);
}

// ============================================
// MARKERS ON MAP
// ============================================
function loadMarkers(assets) {
    // Clear existing markers
    currentMarkers.forEach(marker => map.removeLayer(marker));
    currentMarkers = [];
    
    assets.forEach(asset => {
        let markerColor;
        if (asset.status === 'critical') markerColor = '#ff4444';
        else if (asset.status === 'warning') markerColor = '#ffaa44';
        else markerColor = '#228B22';
        
        const radius = Math.min(8 + (asset.blockages / 3), 20);
        
        const marker = L.circleMarker([asset.lat, asset.lng], {
            radius: radius,
            color: markerColor,
            weight: 2,
            fillColor
