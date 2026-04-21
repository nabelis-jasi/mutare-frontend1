// components/identification.js - Map Identification Tool
// Identifies features by clicking on map, shows popup with all data
// Allows export of identified data as CSV, JSON, PDF, Shapefile

let identificationMode = false;
let currentIdentifiedData = null;
let currentIdentifiedFeatures = [];

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

function initIdentificationTool(map) {
    const toggleBtn = document.getElementById('toggleIdentificationBtn');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    
    if (!toggleBtn) return;
    
    toggleBtn.addEventListener('click', () => {
        identificationMode = !identificationMode;
        const mapContainer = map.getContainer();
        
        if (identificationMode) {
            // Activate mode
            toggleBtn.innerHTML = '<span class="btn-icon">✅</span> Active';
            toggleBtn.classList.add('active');
            
            // Change status display
            if (statusDot) statusDot.classList.add('active');
            if (statusText) statusText.innerHTML = 'Active - Click on map to identify features';
            
            // Change cursor to crosshair with custom style
            mapContainer.style.cursor = 'crosshair';
            mapContainer.classList.add('identification-active');
            
            // Add instruction overlay
            showInstructionOverlay(map);
            
        } else {
            // Deactivate mode
            toggleBtn.innerHTML = '<span class="btn-icon">🎯</span> Activate';
            toggleBtn.classList.remove('active');
            
            if (statusDot) statusDot.classList.remove('active');
            if (statusText) statusText.innerHTML = 'Click button to activate identification tool';
            
            mapContainer.style.cursor = '';
            mapContainer.classList.remove('identification-active');
            
            hideInstructionOverlay();
        }
    });
    
    // Close panel button
    const closeBtn = document.getElementById('closeIdentifyPanel');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            document.getElementById('identifyResultPanel').style.display = 'none';
        });
    }
    
    // Export buttons
    document.getElementById('exportIdentifiedCSV')?.addEventListener('click', () => exportIdentifiedData('csv'));
    document.getElementById('exportIdentifiedJSON')?.addEventListener('click', () => exportIdentifiedData('json'));
    document.getElementById('exportIdentifiedPDF')?.addEventListener('click', () => exportIdentifiedData('pdf'));
    document.getElementById('exportIdentifiedSHP')?.addEventListener('click', () => exportIdentifiedData('shp'));
    document.getElementById('saveIdentification')?.addEventListener('click', saveIdentificationSession);
}

function showInstructionOverlay(map) {
    // Remove existing overlay
    hideInstructionOverlay();
    
    // Create instruction overlay
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
    mapContainer.style.position = 'relative';
    mapContainer.appendChild(overlay);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (overlay) overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay && overlay.remove) overlay.remove();
        }, 500);
    }, 5000);
}

function hideInstructionOverlay() {
    const overlay = document.getElementById('identifyInstructionOverlay');
    if (overlay) overlay.remove();
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
    
    // Generate HTML for each feature
    listContainer.innerHTML = features.map((feature, index) => `
        <div class="identify-feature-card" data-index="${index}">
            <div class="feature-header">
                <strong>${feature.name || feature.asset_code || feature.manhole_id || `Feature ${index + 1}`}</strong>
                <span class="feature-type ${feature.type}">${feature.type || layerType}</span>
            </div>
            <div class="feature-details">
                ${Object.entries(feature).filter(([key]) => !['geometry', 'lat', 'lng', 'coordinates']).map(([key, value]) => `
                    <div class="detail-row">
                        <span class="detail-key">${key}:</span>
                        <span class="detail-value">${value !== null && value !== undefined ? value : '—'}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `).join('');
    
    // Add summary section
    const summaryHtml = `
        <div class="identify-summary">
            <h6>📊 Summary</h6>
            <div class="summary-row"><span>📍 Total Features:</span><span>${features.length}</span></div>
            <div class="summary-row"><span>🗺️ Layer Type:</span><span>${layerType}</span></div>
            <div class="summary-row"><span>📌 Click Location:</span><span>${clickLat.toFixed(6)}, ${clickLng.toFixed(6)}</span></div>
            <div class="summary-row"><span>⏱️ Identified:</span><span>${new Date().toLocaleString()}</span></div>
        </div>
    `;
    
    listContainer.insertAdjacentHTML('afterbegin', summaryHtml);
    panel.style.display = 'block';
}

function generateSummary(features) {
    const summary = {
        total: features.length,
        by_status: {},
        by_suburb: {},
        by_type: {}
    };
    
    features.forEach(f => {
        const status = f.status || f.bloc_stat || f.block_stat || 'unknown';
        summary.by_status[status] = (summary.by_status[status] || 0) + 1;
        
        const suburb = f.suburb || f.suburb_nam || 'unknown';
        summary.by_suburb[suburb] = (summary.by_suburb[suburb] || 0) + 1;
        
        const type = f.type || f.asset_type || f.layer_type || 'unknown';
        summary.by_type[type] = (summary.by_type[type] || 0) + 1;
    });
    
    return summary;
}

function exportIdentifiedData(format) {
    if (!currentIdentifiedData) {
        alert('No data to export');
        return;
    }
    
    switch(format) {
        case 'csv':
            exportToCSV();
            break;
        case 'json':
            exportToJSON();
            break;
        case 'pdf':
            exportToPDF();
            break;
        case 'shp':
            exportToGeoJSON();
            break;
    }
}

function exportToCSV() {
    if (!currentIdentifiedFeatures.length) return;
    
    const headers = Object.keys(currentIdentifiedFeatures[0]);
    const rows = currentIdentifiedFeatures.map(f => headers.map(h => f[h] || ''));
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identified_data_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    alert('CSV exported successfully!');
}

function exportToJSON() {
    const jsonContent = JSON.stringify(currentIdentifiedData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identified_data_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    alert('JSON exported successfully!');
}

function exportToPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(34, 139, 34);
    doc.text('Identification Report', 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
    doc.text(`Location: ${currentIdentifiedData.location.lat.toFixed(6)}, ${currentIdentifiedData.location.lng.toFixed(6)}`, 20, 37);
    doc.text(`Layer: ${currentIdentifiedData.layer_type}`, 20, 44);
    doc.text(`Features Found: ${currentIdentifiedFeatures.length}`, 20, 51);
    
    const tableData = currentIdentifiedFeatures.slice(0, 20).map(f => [
        f.name || f.asset_code || f.manhole_id || '—',
        f.status || f.bloc_stat || '—',
        f.suburb || f.suburb_nam || '—'
    ]);
    
    doc.autoTable({
        startY: 60,
        head: [['Name', 'Status', 'Suburb']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255] }
    });
    
    if (currentIdentifiedFeatures.length > 20) {
        doc.text(`... and ${currentIdentifiedFeatures.length - 20} more features`, 20, doc.lastAutoTable.finalY + 10);
    }
    
    doc.save(`identification_report_${new Date().toISOString().slice(0,19)}.pdf`);
    alert('PDF exported successfully!');
}

function exportToGeoJSON() {
    const features = currentIdentifiedFeatures.map(f => ({
        type: 'Feature',
        geometry: {
            type: 'Point',
            coordinates: [f.lng || 0, f.lat || 0]
        },
        properties: f
    }));
    
    const geojson = {
        type: 'FeatureCollection',
        features: features,
        metadata: {
            generated: new Date().toISOString(),
            source: 'Mutare Sewer Dashboard - Identification Tool'
        }
    };
    
    const content = JSON.stringify(geojson, null, 2);
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `identified_data_${new Date().toISOString().slice(0,19)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
    alert('GeoJSON exported! Use QGIS to convert to Shapefile (.shp).');
}

function saveIdentificationSession() {
    const session = {
        id: Date.now(),
        name: prompt('Enter a name for this identification session:', `Session_${new Date().toISOString().slice(0,19)}`),
        data: currentIdentifiedData,
        savedAt: new Date().toISOString()
    };
    
    if (!session.name) return;
    
    const sessions = JSON.parse(localStorage.getItem('identification_sessions') || '[]');
    sessions.push(session);
    localStorage.setItem('identification_sessions', JSON.stringify(sessions));
    
    alert(`Session "${session.name}" saved successfully!`);
}

function loadSavedSessions() {
    const sessions = JSON.parse(localStorage.getItem('identification_sessions') || '[]');
    return sessions;
}

export default {
    render,
    init: initIdentificationTool,
    showResults: showIdentificationResults,
    getMode: () => identificationMode,
    loadSessions: loadSavedSessions
};
