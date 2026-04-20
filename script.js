// ============================================
// MAIN DASHBOARD LOGIC
// Integrates mapview.js and filters.js
// ============================================

// Mock data
var allManholes = [
    { id: 1, asset_code: 'MH-001', suburb: 'CBD', diameter: 150, material: 'concrete', status: 'critical', blockages: 12, lat: -18.9735, lng: 32.6705 },
    { id: 2, asset_code: 'MH-002', suburb: 'Sakubva', diameter: 100, material: 'PVC', status: 'warning', blockages: 5, lat: -18.9750, lng: 32.6720 },
    { id: 3, asset_code: 'MH-003', suburb: 'Dangamvura', diameter: 80, material: 'asbestos', status: 'good', blockages: 3, lat: -18.9780, lng: 32.6750 },
    { id: 4, asset_code: 'MH-004', suburb: 'CBD', diameter: 120, material: 'concrete', status: 'critical', blockages: 15, lat: -18.9700, lng: 32.6660 },
    { id: 5, asset_code: 'MH-005', suburb: 'Chikanga', diameter: 130, material: 'concrete', status: 'warning', blockages: 7, lat: -18.9650, lng: 32.6600 }
];

var allPipelines = [
    { id: 1, asset_code: 'PL-001', diameter: 200, material: 'concrete', status: 'warning', coordinates: [[-18.9735, 32.6705], [-18.9750, 32.6720]] },
    { id: 2, asset_code: 'PL-002', diameter: 150, material: 'PVC', status: 'good', coordinates: [[-18.9750, 32.6720], [-18.9780, 32.6750]] },
    { id: 3, asset_code: 'PL-003', diameter: 250, material: 'concrete', status: 'critical', coordinates: [[-18.9735, 32.6705], [-18.9700, 32.6660]] }
];

var allSuburbs = [
    { name: 'CBD', area: 5.2, asset_count: 25, blockages: 45, coordinates: [[-18.9760, 32.6670], [-18.9740, 32.6720], [-18.9690, 32.6690], [-18.9710, 32.6650], [-18.9760, 32.6670]] }
];

// Layer visibility
var showManholes = true;
var showPipelines = true;
var showSuburbs = false;

// Charts
var suburbChart, jobsChart;

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    // Initialize map
    if (window.MapView) {
        MapView.init(-18.9735, 32.6705, 13);
    }
    
    // Initialize filters
    if (window.Filters) {
        Filters.init();
    }
    
    // Load initial layers
    loadFilteredLayers();
    
    // Initialize charts
    initCharts();
    
    // Setup event listeners
    setupEventListeners();
    
    // Listen for filter changes
    document.addEventListener('filtersChanged', function() {
        loadFilteredLayers();
        updateChartsAndSummary();
    });
    
    // Base map switcher
    document.getElementById('baseMapSelect').addEventListener('change', function(e) {
        if (window.MapView) {
            MapView.switchBaseMap(e.target.value);
        }
    });
    
    // Layer toggles
    document.getElementById('toggleManholesBtn').addEventListener('click', function() {
        showManholes = !showManholes;
        loadFilteredLayers();
    });
    
    document.getElementById('togglePipelinesBtn').addEventListener('click', function() {
        showPipelines = !showPipelines;
        loadFilteredLayers();
    });
    
    document.getElementById('toggleSuburbsBtn').addEventListener('click', function() {
        showSuburbs = !showSuburbs;
        loadFilteredLayers();
    });
    
    // Toolbar buttons
    document.getElementById('fitBoundsBtn').addEventListener('click', function() {
        if (window.MapView) MapView.fitToBounds();
    });
    
    document.getElementById('heatmapBtn').addEventListener('click', function() {
        var heatPoints = [];
        var filtered = Filters.applyToAssets(allManholes);
        for (var i = 0; i < filtered.length; i++) {
            heatPoints.push([filtered[i].lat, filtered[i].lng, filtered[i].blockages]);
        }
        if (window.MapView) MapView.addHeatmap(heatPoints);
    });
    
    document.getElementById('clearHeatmapBtn').addEventListener('click', function() {
        if (window.MapView) MapView.clearHeatmap();
    });
    
    document.getElementById('weeklyReportBtn').addEventListener('click', generatePDF);
    document.getElementById('exportCSVBtn').addEventListener('click', exportCSV);
    document.getElementById('printMapBtn').addEventListener('click', function() { window.print(); });
    document.getElementById('exportGeoJSONBtn').addEventListener('click', function() { alert('Export GeoJSON coming soon'); });
    
    // Tabs
    var tabs = document.querySelectorAll('.tab');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].addEventListener('click', function() {
            var tabId = this.getAttribute('data-tab');
            var allTabs = document.querySelectorAll('.tab');
            for (var j = 0; j < allTabs.length; j++) {
                allTabs[j].classList.remove('active');
            }
            this.classList.add('active');
            var allContents = document.querySelectorAll('.tab-content');
            for (var k = 0; k < allContents.length; k++) {
                allContents[k].style.display = 'none';
            }
            document.getElementById(tabId + '-tab').style.display = 'block';
        });
    }
});

function loadFilteredLayers() {
    if (!window.Filters || !window.MapView) return;
    
    var filteredManholes = Filters.applyToAssets(allManholes);
    
    if (showManholes) {
        MapView.loadManholes(filteredManholes);
    } else {
        MapView.loadManholes([]);
    }
    
    if (showPipelines) {
        // Filter pipelines based on status from filters
        var filters = Filters.getCurrent();
        var filteredPipes = allPipelines;
        if (filters.status !== 'all') {
            filteredPipes = allPipelines.filter(function(p) { return p.status === filters.status; });
        }
        MapView.loadPipelines(filteredPipes);
    } else {
        MapView.loadPipelines([]);
    }
    
    if (showSuburbs) {
        MapView.loadSuburbs(allSuburbs);
    } else {
        MapView.loadSuburbs([]);
    }
    
    // Update summary numbers
    document.getElementById('totalManholes').innerText = filteredManholes.length;
    document.getElementById('totalPipelines').innerText = showPipelines ? allPipelines.length : 0;
    var criticalCount = filteredManholes.filter(function(m) { return m.status === 'critical'; }).length;
    document.getElementById('criticalAssets').innerText = criticalCount;
    var totalBlockages = filteredManholes.reduce(function(sum, m) { return sum + m.blockages; }, 0);
    document.getElementById('totalBlockages').innerText = totalBlockages;
    
    // Update problem assets list
    var sorted = filteredManholes.sort(function(a, b) { return b.blockages - a.blockages; }).slice(0, 5);
    var problemList = document.getElementById('problemAssetsList');
    if (problemList) {
        problemList.innerHTML = '';
        for (var i = 0; i < sorted.length; i++) {
            var div = document.createElement('div');
            div.className = 'stat-row';
            div.innerHTML = '<span>' + sorted[i].asset_code + ' - ' + sorted[i].suburb + '</span><span>' + sorted[i].blockages + ' blockages</span>';
            problemList.appendChild(div);
        }
    }
}

function initCharts() {
    var suburbCtx = document.getElementById('suburbChart').getContext('2d');
    var jobsCtx = document.getElementById('jobsChart').getContext('2d');
    
    suburbChart = new Chart(suburbCtx, {
        type: 'bar',
        data: { labels: ['CBD', 'Sakubva', 'Dangamvura', 'Chikanga'], datasets: [{ label: 'Blockages', data: [0, 0, 0, 0], backgroundColor: '#228B22' }] },
        options: { responsive: true, maintainAspectRatio: true }
    });
    
    jobsChart = new Chart(jobsCtx, {
        type: 'pie',
        data: { labels: ['Unblocking', 'Inspection', 'Repair'], datasets: [{ data: [45, 23, 12], backgroundColor: ['#228B22', '#44aa44', '#66cc66'] }] },
        options: { responsive: true }
    });
}

function updateChartsAndSummary() {
    if (!window.Filters) return;
    var filtered = Filters.applyToAssets(allManholes);
    
    var suburbData = { 'CBD': 0, 'Sakubva': 0, 'Dangamvura': 0, 'Chikanga': 0 };
    for (var i = 0; i < filtered.length; i++) {
        if (suburbData[filtered[i].suburb] !== undefined) {
            suburbData[filtered[i].suburb] += filtered[i].blockages;
        }
    }
    
    if (suburbChart) {
        suburbChart.data.datasets[0].data = Object.values(suburbData);
        suburbChart.update();
    }
}

function generatePDF() {
    var { jsPDF } = window.jspdf;
    var doc = new jsPDF();
    doc.setFontSize(16);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare Sewer Report', 20, 20);
   
