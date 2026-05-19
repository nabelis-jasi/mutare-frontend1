// components/filters.js - Complete Working Cascading Filter
// Matches Tactical Ops Theme

const API_BASE_URL = 'http://localhost:5000/api';

// Current active filters
let currentFilters = {
    suburb_nam: 'all',
    township: 'all',
    zone: 'all',
    ward: 'all',
    op_zone: 'all',
    manhole_status: 'all',
    manhole_depth_min: '',
    manhole_depth_max: '',
    pipe_material: 'all',
    pipe_size: 'all',
    pipe_status: 'all',
    length_min: '',
    length_max: '',
    inspector: 'all',
    date_from: '',
    date_to: '',
    search_text: ''
};

// Filter options data
let filterData = {
    suburbs: [],
    townships: [],
    zones: [],
    wards: [],
    op_zones: [],
    inspectors: [],
    manhole_statuses: ['good', 'warning', 'critical', 'blocked', 'partial'],
    pipe_materials: ['E/W', 'PVC', 'Concrete', 'Cast Iron', 'HDPE'],
    pipe_sizes: [50, 75, 100, 150, 200, 250, 300, 375, 450, 525, 600],
    pipe_statuses: ['good', 'warning', 'critical', 'blocked', 'partial']
};

let tempFilters = { ...currentFilters };
let currentData = { manholes: [], pipelines: [] };

// ============================================
// LOAD DATA FROM BACKEND
// ============================================

async function loadFilterData() {
    console.log('Loading filter data from backend...');
    
    try {
        // Load filter options from backend
        const response = await fetch(`${API_BASE_URL}/suburbs/filter-options`);
        if (response.ok) {
            const data = await response.json();
            filterData.suburbs = data.suburbs || [];
            filterData.townships = data.townships || [];
            filterData.zones = data.zones || [];
            filterData.wards = data.wards || [];
            filterData.op_zones = data.op_zones || [];
            console.log('Filter options loaded:', filterData);
        }
        
        // Load inspectors from manholes
        const manholesRes = await fetch(`${API_BASE_URL}/manholes/list`);
        if (manholesRes.ok) {
            const manholes = await manholesRes.json();
            filterData.inspectors = [...new Set(manholes.map(m => m.inspector).filter(i => i))];
        }
        
    } catch (error) {
        console.error('Error loading filter data:', error);
    }
}

// ============================================
// CASCADING FILTERS
// ============================================

async function updateCascadingOptions(suburb) {
    if (!suburb || suburb === 'all') {
        // Reset to all options
        const response = await fetch(`${API_BASE_URL}/suburbs/filter-options`);
        if (response.ok) {
            const data = await response.json();
            filterData.townships = data.townships || [];
            filterData.zones = data.zones || [];
            filterData.wards = data.wards || [];
            filterData.op_zones = data.op_zones || [];
        }
    } else {
        // Get options filtered by suburb
        try {
            const response = await fetch(`${API_BASE_URL}/suburbs/cascade?suburb=${encodeURIComponent(suburb)}`);
            if (response.ok) {
                const data = await response.json();
                filterData.townships = data.townships || [];
                filterData.zones = data.zones || [];
                filterData.wards = data.wards || [];
                filterData.op_zones = data.op_zones || [];
                console.log(`Cascading options for ${suburb}:`, filterData);
            }
        } catch (error) {
            console.error('Error updating cascading options:', error);
        }
    }
    
    // Update dropdown UIs
    if (townshipSelect) townshipSelect.updateOptions(filterData.townships);
    if (zoneSelect) zoneSelect.updateOptions(filterData.zones);
    if (wardSelect) wardSelect.updateOptions(filterData.wards.map(w => `Ward ${w}`));
    if (opZoneSelect) opZoneSelect.updateOptions(filterData.op_zones.map(oz => `Op Zone ${oz}`));
}

// ============================================
// API FUNCTIONS
// ============================================

async function getFilteredManholes() {
    const params = new URLSearchParams();
    if (currentFilters.suburb_nam && currentFilters.suburb_nam !== 'all') params.append('suburb', currentFilters.suburb_nam);
    if (currentFilters.township && currentFilters.township !== 'all') params.append('township', currentFilters.township);
    if (currentFilters.zone && currentFilters.zone !== 'all') params.append('zone', currentFilters.zone);
    if (currentFilters.ward && currentFilters.ward !== 'all') params.append('ward', currentFilters.ward);
    if (currentFilters.op_zone && currentFilters.op_zone !== 'all') params.append('op_zone', currentFilters.op_zone);
    if (currentFilters.manhole_status !== 'all') params.append('status', currentFilters.manhole_status);
    if (currentFilters.manhole_depth_min) params.append('depth_min', currentFilters.manhole_depth_min);
    if (currentFilters.manhole_depth_max) params.append('depth_max', currentFilters.manhole_depth_max);
    if (currentFilters.inspector !== 'all') params.append('inspector', currentFilters.inspector);
    if (currentFilters.date_from) params.append('date_from', currentFilters.date_from);
    if (currentFilters.date_to) params.append('date_to', currentFilters.date_to);
    if (currentFilters.search_text) params.append('search', currentFilters.search_text);
    
    try {
        const response = await fetch(`${API_BASE_URL}/manholes/list?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        currentData.manholes = data;
        return data;
    } catch (error) {
        console.error('Error fetching manholes:', error);
        return [];
    }
}

async function getFilteredPipelines() {
    const params = new URLSearchParams();
    if (currentFilters.suburb_nam && currentFilters.suburb_nam !== 'all') params.append('suburb', currentFilters.suburb_nam);
    if (currentFilters.township && currentFilters.township !== 'all') params.append('township', currentFilters.township);
    if (currentFilters.pipe_material !== 'all') params.append('material', currentFilters.pipe_material);
    if (currentFilters.pipe_size !== 'all') params.append('size', currentFilters.pipe_size);
    if (currentFilters.pipe_status !== 'all') params.append('status', currentFilters.pipe_status);
    if (currentFilters.length_min) params.append('length_min', currentFilters.length_min);
    if (currentFilters.length_max) params.append('length_max', currentFilters.length_max);
    if (currentFilters.search_text) params.append('search', currentFilters.search_text);
    
    try {
        const response = await fetch(`${API_BASE_URL}/pipelines/list?${params.toString()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        currentData.pipelines = data;
        return data;
    } catch (error) {
        console.error('Error fetching pipelines:', error);
        return [];
    }
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

function exportToJSON() {
    const exportData = { filters: currentFilters, data: currentData, exported_at: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sewer_export_${new Date().toISOString().slice(0,19)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToCSV() {
    const rows = [['Type', 'ID', 'Name', 'Suburb', 'Township', 'Status', 'Material', 'Size', 'Depth/Length', 'Inspector', 'Date'].join(',')];
    
    currentData.manholes.forEach(m => {
        rows.push(['Manhole', m.id || m.manhole_id, m.name, m.suburb, '', m.status, '', '', m.depth, m.inspector, m.inspection_date].join(','));
    });
    
    currentData.pipelines.forEach(p => {
        rows.push(['Pipeline', p.id || p.pipe_id, p.name, '', '', p.status, p.material, p.diameter, p.length, '', ''].join(','));
    });
    
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sewer_export_${new Date().toISOString().slice(0,19)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function exportToPDF() { window.print(); }
function exportToSHP() { alert('Shapefile export - Feature coming soon'); }

// ============================================
// RENDER MODAL
// ============================================

function renderModal() {
    return `
        <div id="filterModal" class="filter-modal">
            <div class="filter-modal-content">
                <div class="filter-modal-header">
                    <h3>🔍 FILTERS</h3>
                    <button id="closeFilterModal" class="close-modal">✕</button>
                </div>
                <div class="filter-modal-body">
                    <!-- EXPORT SECTION -->
                    <div class="filter-section-group">
                        <h4>📤 EXPORT DATA</h4>
                        <div class="export-buttons">
                            <button id="exportJSONBtn" class="export-btn json">JSON</button>
                            <button id="exportCSVBtn" class="export-btn csv">CSV</button>
                            <button id="exportPDFBtn" class="export-btn pdf">PDF</button>
                            <button id="exportSHPBtn" class="export-btn shp">SHP</button>
                        </div>
                    </div>
                    
                    <!-- LOCATION SECTION -->
                    <div class="filter-section-group">
                        <h4>📍 LOCATION</h4>
                        <div class="filter-group">
                            <label>Suburb</label>
                            <select id="suburbSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.suburbs.map(s => `<option value="${s}">${s}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Township</label>
                            <select id="townshipSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.townships.map(t => `<option value="${t}">${t}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-row">
                            <div class="filter-group half">
                                <label>Zone</label>
                                <select id="zoneSelect" class="filter-input">
                                    <option value="all">ALL</option>
                                    ${filterData.zones.map(z => `<option value="${z}">Zone ${z}</option>`).join('')}
                                </select>
                            </div>
                            <div class="filter-group half">
                                <label>Ward</label>
                                <select id="wardSelect" class="filter-input">
                                    <option value="all">ALL</option>
                                    ${filterData.wards.map(w => `<option value="${w}">Ward ${w}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        <div class="filter-group">
                            <label>Operational Zone</label>
                            <select id="opZoneSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.op_zones.map(oz => `<option value="${oz}">Op Zone ${oz}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    
                    <!-- MANHOLE SECTION -->
                    <div class="filter-section-group">
                        <h4>🕳️ MANHOLES</h4>
                        <div class="filter-group">
                            <label>Blockage Status</label>
                            <select id="manholeStatusSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.manhole_statuses.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-row">
                            <div class="filter-group half">
                                <label>Min Depth (m)</label>
                                <input type="number" id="depthMinInput" class="filter-input" step="0.1" placeholder="e.g., 1.5">
                            </div>
                            <div class="filter-group half">
                                <label>Max Depth (m)</label>
                                <input type="number" id="depthMaxInput" class="filter-input" step="0.1" placeholder="e.g., 5">
                            </div>
                        </div>
                    </div>
                    
                    <!-- PIPELINE SECTION -->
                    <div class="filter-section-group">
                        <h4>📏 PIPELINES</h4>
                        <div class="filter-group">
                            <label>Pipe Material</label>
                            <select id="pipeMaterialSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.pipe_materials.map(m => `<option value="${m}">${m}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Pipe Size (mm)</label>
                            <select id="pipeSizeSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.pipe_sizes.map(s => `<option value="${s}">${s} mm</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Blockage Status</label>
                            <select id="pipeStatusSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.pipe_statuses.map(s => `<option value="${s}">${s.toUpperCase()}</option>`).join('')}
                            </select>
                        </div>
                        <div class="filter-row">
                            <div class="filter-group half">
                                <label>Min Length (m)</label>
                                <input type="number" id="lengthMinInput" class="filter-input" step="1" placeholder="e.g., 10">
                            </div>
                            <div class="filter-group half">
                                <label>Max Length (m)</label>
                                <input type="number" id="lengthMaxInput" class="filter-input" step="1" placeholder="e.g., 100">
                            </div>
                        </div>
                    </div>
                    
                    <!-- INSPECTOR SECTION -->
                    <div class="filter-section-group">
                        <h4>👤 INSPECTOR</h4>
                        <div class="filter-group">
                            <select id="inspectorSelect" class="filter-input">
                                <option value="all">ALL</option>
                                ${filterData.inspectors.map(i => `<option value="${i}">${i}</option>`).join('')}
                            </select>
                        </div>
                        <div class="date-range">
                            <input type="date" id="dateFromInput" class="filter-input" placeholder="From Date">
                            <input type="date" id="dateToInput" class="filter-input" placeholder="To Date">
                        </div>
                    </div>
                    
                    <!-- SEARCH SECTION -->
                    <div class="filter-section-group">
                        <h4>🔎 SEARCH</h4>
                        <div class="filter-group">
                            <input type="text" id="searchTextInput" class="filter-input" placeholder="Search by ID, suburb, pipe ID...">
                        </div>
                    </div>
                    
                    <!-- ACTIVE FILTERS SUMMARY -->
                    <div id="filterSummary" class="filter-summary" style="display: none;">
                        <div class="filter-summary-title">Active Filters:</div>
                        <div id="filterTags" class="filter-tags"></div>
                    </div>
                </div>
                <div class="filter-modal-footer">
                    <button id="resetFiltersBtn" class="reset-btn">🗑️ RESET</button>
                    <button id="applyFiltersBtn" class="apply-btn">✅ APPLY</button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// UPDATE UI FUNCTIONS
// ============================================

function updateFilterSummary() {
    const activeFilters = [];
    if (tempFilters.suburb_nam && tempFilters.suburb_nam !== 'all') activeFilters.push(`Suburb: ${tempFilters.suburb_nam}`);
    if (tempFilters.township && tempFilters.township !== 'all') activeFilters.push(`Township: ${tempFilters.township}`);
    if (tempFilters.zone && tempFilters.zone !== 'all') activeFilters.push(`Zone: ${tempFilters.zone}`);
    if (tempFilters.ward && tempFilters.ward !== 'all') activeFilters.push(`Ward: ${tempFilters.ward}`);
    if (tempFilters.op_zone && tempFilters.op_zone !== 'all') activeFilters.push(`Op Zone: ${tempFilters.op_zone}`);
    if (tempFilters.manhole_status && tempFilters.manhole_status !== 'all') activeFilters.push(`Manhole: ${tempFilters.manhole_status}`);
    if (tempFilters.pipe_material && tempFilters.pipe_material !== 'all') activeFilters.push(`Material: ${tempFilters.pipe_material}`);
    if (tempFilters.pipe_size && tempFilters.pipe_size !== 'all') activeFilters.push(`Size: ${tempFilters.pipe_size}mm`);
    if (tempFilters.inspector && tempFilters.inspector !== 'all') activeFilters.push(`Inspector: ${tempFilters.inspector}`);
    if (tempFilters.date_from) activeFilters.push(`From: ${tempFilters.date_from}`);
    if (tempFilters.date_to) activeFilters.push(`To: ${tempFilters.date_to}`);
    if (tempFilters.search_text) activeFilters.push(`Search: ${tempFilters.search_text}`);
    
    const summaryDiv = document.getElementById('filterSummary');
    const tagsDiv = document.getElementById('filterTags');
    
    if (activeFilters.length > 0) {
        summaryDiv.style.display = 'block';
        tagsDiv.innerHTML = activeFilters.map(f => `<span class="filter-tag">${f}</span>`).join('');
    } else {
        summaryDiv.style.display = 'none';
    }
}

function updateFilterButtonText() {
    const filterBtn = document.getElementById('mainFilterBtn');
    if (!filterBtn) return;
    
    let activeCount = 0;
    const keys = ['suburb_nam', 'township', 'zone', 'ward', 'op_zone', 'manhole_status', 'pipe_material', 'pipe_size', 'inspector'];
    keys.forEach(k => { if (currentFilters[k] && currentFilters[k] !== 'all') activeCount++; });
    if (currentFilters.search_text) activeCount++;
    if (currentFilters.manhole_depth_min) activeCount++;
    if (currentFilters.length_min) activeCount++;
    if (currentFilters.date_from) activeCount++;
    
    if (activeCount === 0) {
        filterBtn.innerHTML = '🔍 FILTERS';
        filterBtn.classList.remove('active-filter');
    } else {
        filterBtn.innerHTML = `🔍 FILTERS (${activeCount})`;
        filterBtn.classList.add('active-filter');
        
        // Update summary text
        const summaryDiv = document.getElementById('activeFiltersSummary');
        if (summaryDiv) summaryDiv.innerHTML = `${activeCount} active filter(s)`;
    }
}

// ============================================
// MODAL FUNCTIONS
// ============================================

function openFilterModal() {
    tempFilters = JSON.parse(JSON.stringify(currentFilters));
    
    // Set dropdown values
    document.getElementById('suburbSelect').value = tempFilters.suburb_nam;
    document.getElementById('townshipSelect').value = tempFilters.township;
    document.getElementById('zoneSelect').value = tempFilters.zone;
    document.getElementById('wardSelect').value = tempFilters.ward;
    document.getElementById('opZoneSelect').value = tempFilters.op_zone;
    document.getElementById('manholeStatusSelect').value = tempFilters.manhole_status;
    document.getElementById('pipeMaterialSelect').value = tempFilters.pipe_material;
    document.getElementById('pipeSizeSelect').value = tempFilters.pipe_size;
    document.getElementById('pipeStatusSelect').value = tempFilters.pipe_status;
    document.getElementById('inspectorSelect').value = tempFilters.inspector;
    document.getElementById('depthMinInput').value = tempFilters.manhole_depth_min;
    document.getElementById('depthMaxInput').value = tempFilters.manhole_depth_max;
    document.getElementById('lengthMinInput').value = tempFilters.length_min;
    document.getElementById('lengthMaxInput').value = tempFilters.length_max;
    document.getElementById('dateFromInput').value = tempFilters.date_from;
    document.getElementById('dateToInput').value = tempFilters.date_to;
    document.getElementById('searchTextInput').value = tempFilters.search_text;
    
    updateFilterSummary();
    
    const modal = document.getElementById('filterModal');
    if (modal) modal.style.display = 'flex';
}

function closeFilterModal() {
    const modal = document.getElementById('filterModal');
    if (modal) modal.style.display = 'none';
}

async function applyFilters() {
    // Get values from dropdowns
    tempFilters.suburb_nam = document.getElementById('suburbSelect').value;
    tempFilters.township = document.getElementById('townshipSelect').value;
    tempFilters.zone = document.getElementById('zoneSelect').value;
    tempFilters.ward = document.getElementById('wardSelect').value;
    tempFilters.op_zone = document.getElementById('opZoneSelect').value;
    tempFilters.manhole_status = document.getElementById('manholeStatusSelect').value;
    tempFilters.pipe_material = document.getElementById('pipeMaterialSelect').value;
    tempFilters.pipe_size = document.getElementById('pipeSizeSelect').value;
    tempFilters.pipe_status = document.getElementById('pipeStatusSelect').value;
    tempFilters.inspector = document.getElementById('inspectorSelect').value;
    tempFilters.manhole_depth_min = document.getElementById('depthMinInput').value;
    tempFilters.manhole_depth_max = document.getElementById('depthMaxInput').value;
    tempFilters.length_min = document.getElementById('lengthMinInput').value;
    tempFilters.length_max = document.getElementById('lengthMaxInput').value;
    tempFilters.date_from = document.getElementById('dateFromInput').value;
    tempFilters.date_to = document.getElementById('dateToInput').value;
    tempFilters.search_text = document.getElementById('searchTextInput').value;
    
    currentFilters = JSON.parse(JSON.stringify(tempFilters));
    updateFilterButtonText();
    closeFilterModal();
    await triggerFilterChange();
}

function resetFilters() {
    tempFilters = {
        suburb_nam: 'all', township: 'all', zone: 'all', ward: 'all', op_zone: 'all',
        manhole_status: 'all', manhole_depth_min: '', manhole_depth_max: '',
        pipe_material: 'all', pipe_size: 'all', pipe_status: 'all',
        length_min: '', length_max: '', inspector: 'all',
        date_from: '', date_to: '', search_text: ''
    };
    
    // Reset all dropdowns
    document.getElementById('suburbSelect').value = 'all';
    document.getElementById('townshipSelect').value = 'all';
    document.getElementById('zoneSelect').value = 'all';
    document.getElementById('wardSelect').value = 'all';
    document.getElementById('opZoneSelect').value = 'all';
    document.getElementById('manholeStatusSelect').value = 'all';
    document.getElementById('pipeMaterialSelect').value = 'all';
    document.getElementById('pipeSizeSelect').value = 'all';
    document.getElementById('pipeStatusSelect').value = 'all';
    document.getElementById('inspectorSelect').value = 'all';
    document.getElementById('depthMinInput').value = '';
    document.getElementById('depthMaxInput').value = '';
    document.getElementById('lengthMinInput').value = '';
    document.getElementById('lengthMaxInput').value = '';
    document.getElementById('dateFromInput').value = '';
    document.getElementById('dateToInput').value = '';
    document.getElementById('searchTextInput').value = '';
    
    updateFilterSummary();
    
    // Reset cascading options
    updateCascadingOptions(null);
}

async function triggerFilterChange() {
    try {
        const [manholes, pipelines] = await Promise.all([getFilteredManholes(), getFilteredPipelines()]);
        document.dispatchEvent(new CustomEvent('filtersChanged', { 
            detail: { manholes, pipelines, filters: currentFilters, count: manholes.length + pipelines.length }
        }));
        console.log(`Filter applied: ${manholes.length} manholes, ${pipelines.length} pipelines`);
    } catch (err) {
        console.error('Error applying filters:', err);
    }
}

// ============================================
// EVENT HANDLERS
// ============================================

function attachModalEvents() {
    document.getElementById('closeFilterModal')?.addEventListener('click', closeFilterModal);
    document.getElementById('applyFiltersBtn')?.addEventListener('click', applyFilters);
    document.getElementById('resetFiltersBtn')?.addEventListener('click', resetFilters);
    document.getElementById('exportJSONBtn')?.addEventListener('click', exportToJSON);
    document.getElementById('exportCSVBtn')?.addEventListener('click', exportToCSV);
    document.getElementById('exportPDFBtn')?.addEventListener('click', exportToPDF);
    document.getElementById('exportSHPBtn')?.addEventListener('click', exportToSHP);
    
    // Cascading: when suburb changes, update other dropdowns
    document.getElementById('suburbSelect')?.addEventListener('change', (e) => {
        updateCascadingOptions(e.target.value);
    });
}

// ============================================
// INITIALIZATION
// ============================================

async function initFilters() {
    console.log('Initializing cascading filters...');
    
    await loadFilterData();
    
    // Create modal if not exists
    if (!document.getElementById('filterModal')) {
        document.body.insertAdjacentHTML('beforeend', renderModal());
        attachModalEvents();
    }
    
    // Update filter button
    const filterBtn = document.getElementById('mainFilterBtn');
    if (filterBtn) {
        filterBtn.addEventListener('click', openFilterModal);
    }
    
    updateFilterButtonText();
    console.log('Filters ready!');
}

// ============================================
// EXPORTS
// ============================================

export default {
    init: initFilters,
    getFilteredManholes,
    getFilteredPipelines,
    getCurrentFilters: () => currentFilters,
    exportToJSON,
    exportToCSV,
    exportToPDF,
    exportToSHP
};