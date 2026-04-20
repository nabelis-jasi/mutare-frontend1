// ============================================
// FILTERS.JS - Complete Sewer Network Filters
// Supports: waste_water_pipeline, waste_water_manhole, suburbs
// Accordion style collapsible sections
// ============================================

// ============================================
// 1. FILTER STATE
// ============================================

let currentFilters = {
    // ===== PIPELINE FILTERS =====
    pipe_id: 'all',
    pipe_mat: 'all',          // E/W, PVC, Concrete, etc.
    pipe_size: 'all',         // 100, 150, 200, 250, 300, etc.
    block_stat: 'all',        // blocked, critical, warning, good
    class: 'all',             // pipe classification
    inspector: 'all',         // who inspected
    type: 'all',              // pipe type
    length: 'all',            // length range
    start_mh: 'all',          // starting manhole
    end_mh: 'all',            // ending manhole
    
    // ===== MANHOLE FILTERS =====
    manhole_id: 'all',
    mh_depth: 'all',          // depth range
    mh_type: 'all',           // manhole type
    ground_lv: 'all',         // ground level
    inv_lev: 'all',           // invert level
    suburb_nam: 'all',        // suburb name
    bloc_stat_mh: 'all',      // manhole blockage status
    
    // ===== SUBURB FILTERS =====
    suburb_name: 'all',
    township: 'all',          // UTALI, etc.
    ward: 'all',              // ward number
    op_zone: 'all',           // operational zone
    short_name: 'all',        // short code (BDV, YVL, WES)
    
    // ===== COMMON FILTERS =====
    search_text: '',          // text search across all fields
    date_from: 'all',         // inspection date from
    date_to: 'all'            // inspection date to
};

// Mock data for testing
const allManholes = [
    { id: 1, name: 'MH-001', suburb: 'CBD', diameter: 150, status: 'critical', blockages: 12, lat: -18.9735, lng: 32.6705 },
    { id: 2, name: 'MH-002', suburb: 'Sakubva', diameter: 100, status: 'warning', blockages: 5, lat: -18.9750, lng: 32.6720 },
    { id: 3, name: 'MH-003', suburb: 'Dangamvura', diameter: 80, status: 'good', blockages: 3, lat: -18.9780, lng: 32.6750 },
    { id: 4, name: 'MH-004', suburb: 'CBD', diameter: 120, status: 'critical', blockages: 15, lat: -18.9700, lng: 32.6660 },
    { id: 5, name: 'MH-005', suburb: 'Chikanga', diameter: 130, status: 'warning', blockages: 7, lat: -18.9650, lng: 32.6600 }
];

const allPipelines = [
    { id: 1, name: 'PL-001', status: 'warning', coordinates: [[-18.9735, 32.6705], [-18.9750, 32.6720]] },
    { id: 2, name: 'PL-002', status: 'good', coordinates: [[-18.9750, 32.6720], [-18.9780, 32.6750]] },
    { id: 3, name: 'PL-003', status: 'critical', coordinates: [[-18.9735, 32.6705], [-18.9700, 32.6660]] }
];

// ============================================
// 2. FILTER OPTIONS (from actual database)
// ============================================

const filterOptions = {
    pipe_materials: ['E/W', 'PVC', 'Concrete', 'Cast Iron', 'Asbestos', 'Clay', 'HDPE', 'Steel'],
    pipe_sizes: [50, 75, 100, 150, 200, 250, 300, 375, 450, 525, 600, 750, 900, 1050, 1200],
    block_statuses: [
        { value: 'blocked', label: 'BLOCKED - Critical', color: '#dc3545' },
        { value: 'partial', label: 'PARTIAL BLOCKAGE - Warning', color: '#ffc107' },
        { value: 'clear', label: 'CLEAR - Good', color: '#28a745' },
        { value: 'unknown', label: 'UNKNOWN - Needs Inspection', color: '#6c757d' }
    ],
    pipe_classes: ['Primary', 'Secondary', 'Tertiary', 'Trunk', 'Branch', 'Lateral'],
    inspectors: ['John Smith', 'Mary Jones', 'Peter Moyo', 'Tendai Ncube', 'Charles Dube', 'Pending'],
    pipe_types: ['Gravity', 'Force Main', 'Vacuum', 'Siphon', 'Rising Main'],
    manhole_types: ['Standard', 'Deep', 'Drop', 'Access', 'Junction', 'Terminal'],
    suburbs: ['CBD', 'Sakubva', 'Dangamvura', 'Chikanga', 'Yeovil', 'BORDERVALE 1', 'WESTLEA', 'UTALI'],
    townships: ['UTALI', 'CBD', 'Sakubva', 'Dangamvura'],
    op_zones: ['TOWN', 'EAST', 'WEST', 'NORTH', 'SOUTH', 'INDUSTRIAL'],
    depth_ranges: [
        { value: 'shallow', label: '< 2 m', min: 0, max: 2 },
        { value: 'medium', label: '2 - 4 m', min: 2, max: 4 },
        { value: 'deep', label: '> 4 m', min: 4, max: 100 }
    ],
    length_ranges: [
        { value: 'short', label: '< 50 m', min: 0, max: 50 },
        { value: 'medium', label: '50 - 100 m', min: 50, max: 100 },
        { value: 'long', label: '> 100 m', min: 100, max: 9999 }
    ]
};

// ============================================
// 3. HELPER FUNCTIONS
// ============================================

function getFilteredManholes() {
    return allManholes;
}

function getFilteredPipelines() {
    return allPipelines;
}

function getAllManholes() {
    return allManholes;
}

function getAllPipelines() {
    return allPipelines;
}

function getCurrentFilters() {
    return currentFilters;
}

function getFilterOptions() {
    return filterOptions;
}

// ============================================
// 4. BUILD ACCORDION FILTERS DYNAMICALLY
// ============================================

function buildAccordionFilters() {
    const container = document.getElementById('accordion-filters-container');
    if (!container) return;
    
    const filterSections = [
        {
            id: 'pipeline',
            title: '📏 WASTE WATER PIPELINE',
            icon: '📏',
            groups: [
                { label: 'Pipe ID', type: 'pipe_id', inputType: 'text', placeholder: 'Enter pipe ID...' },
                { label: 'Pipe Material', type: 'pipe_mat', options: filterOptions.pipe_materials },
                { label: 'Pipe Size (mm)', type: 'pipe_size', options: filterOptions.pipe_sizes.map(s => s.toString()) },
                { label: 'Blockage Status', type: 'block_stat', options: filterOptions.block_statuses },
                { label: 'Pipe Class', type: 'class', options: filterOptions.pipe_classes },
                { label: 'Inspector', type: 'inspector', options: filterOptions.inspectors },
                { label: 'Pipe Type', type: 'type', options: filterOptions.pipe_types },
                { label: 'Length Range', type: 'length', options: filterOptions.length_ranges },
                { label: 'Start Manhole', type: 'start_mh', inputType: 'text', placeholder: 'Start MH...' },
                { label: 'End Manhole', type: 'end_mh', inputType: 'text', placeholder: 'End MH...' }
            ]
        },
        {
            id: 'manhole',
            title: '🕳️ WASTE WATER MANHOLE',
            icon: '🕳️',
            groups: [
                { label: 'Manhole ID', type: 'manhole_id', inputType: 'text', placeholder: 'Enter manhole ID...' },
                { label: 'Depth Range', type: 'mh_depth', options: filterOptions.depth_ranges },
                { label: 'Manhole Type', type: 'mh_type', options: filterOptions.manhole_types },
                { label: 'Suburb', type: 'suburb_nam', options: filterOptions.suburbs },
                { label: 'Blockage Status', type: 'bloc_stat_mh', options: filterOptions.block_statuses },
                { label: 'Inspector', type: 'inspector_mh', options: filterOptions.inspectors }
            ]
        },
        {
            id: 'suburb',
            title: '🏘️ SUBURBS BOUNDARY',
            icon: '🏘️',
            groups: [
                { label: 'Suburb Name', type: 'suburb_name', options: filterOptions.suburbs },
                { label: 'Township', type: 'township', options: filterOptions.townships },
                { label: 'Ward', type: 'ward', inputType: 'text', placeholder: 'Ward number...' },
                { label: 'Operational Zone', type: 'op_zone', options: filterOptions.op_zones },
                { label: 'Short Name', type: 'short_name', inputType: 'text', placeholder: 'Short code (e.g., BDV)...' }
            ]
        },
        {
            id: 'general',
            title: '🔍 GENERAL SEARCH',
            icon: '🔍',
            groups: [
                { label: 'Text Search', type: 'search_text', inputType: 'text', placeholder: 'Search across all fields...' },
                { label: 'Inspection Date From', type: 'date_from', inputType: 'date' },
                { label: 'Inspection Date To', type: 'date_to', inputType: 'date' }
            ]
        }
    ];
    
    container.innerHTML = '';
    
    for (let i = 0; i < filterSections.length; i++) {
        const section = filterSections[i];
        
        const accordionDiv = document.createElement('div');
        accordionDiv.className = 'accordion-section';
        
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.setAttribute('data-accordion', section.id);
        header.innerHTML = `<span>${section.icon} ${section.title}</span><span class="arrow">▶</span>`;
        
        const content = document.createElement('div');
        content.className = 'accordion-content';
        content.setAttribute('data-content', section.id);
        
        const inner = document.createElement('div');
        inner.className = 'accordion-content-inner';
        
        for (let j = 0; j < section.groups.length; j++) {
            const group = section.groups[j];
            const groupDiv = document.createElement('div');
            groupDiv.className = 'filter-group';
            
            const labelSpan = document.createElement('div');
            labelSpan.className = 'filter-label';
            labelSpan.textContent = group.label;
            groupDiv.appendChild(labelSpan);
            
            const controlsDiv = document.createElement('div');
            controlsDiv.className = 'filter-controls';
            
            if (group.options) {
                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'filter-buttons';
                buttonsDiv.id = `${group.type}Filters`;
                
                const allBtn = document.createElement('button');
                allBtn.className = 'filter-btn active';
                allBtn.setAttribute(`data-${group.type}`, 'all');
                allBtn.textContent = 'ALL';
                buttonsDiv.appendChild(allBtn);
                
                for (let k = 0; k < group.options.length; k++) {
                    const opt = group.options[k];
                    const btn = document.createElement('button');
                    btn.className = 'filter-btn';
                    
                    if (typeof opt === 'string') {
                        btn.setAttribute(`data-${group.type}`, opt);
                        btn.textContent = opt;
                    } else {
                        btn.setAttribute(`data-${group.type}`, opt.value);
                        btn.textContent = opt.label;
                        if (opt.color) btn.style.borderLeftColor = opt.color;
                    }
                    buttonsDiv.appendChild(btn);
                }
                controlsDiv.appendChild(buttonsDiv);
            } else if (group.inputType) {
                const input = document.createElement('input');
                input.type = group.inputType;
                input.className = 'filter-input';
                input.placeholder = group.placeholder || '';
                input.id = `${group.type}Input`;
                input.addEventListener('input', function(gt) {
                    return function(e) { updateTextFilter(gt, e.target.value); };
                }(group.type));
                controlsDiv.appendChild(input);
            }
            
            groupDiv.appendChild(controlsDiv);
            inner.appendChild(groupDiv);
        }
        
        content.appendChild(inner);
        accordionDiv.appendChild(header);
        accordionDiv.appendChild(content);
        container.appendChild(accordionDiv);
    }
    
    const firstHeader = document.querySelector('.accordion-header');
    if (firstHeader) {
        firstHeader.classList.add('active');
        const firstContent = document.querySelector('.accordion-content');
        if (firstContent) firstContent.classList.add('active');
    }
}

// ============================================
// 5. ATTACH EVENTS
// ============================================

function attachAccordionEvents() {
    const headers = document.querySelectorAll('.accordion-header');
    for (let i = 0; i < headers.length; i++) {
        headers[i].addEventListener('click', function() {
            const accordionId = this.getAttribute('data-accordion');
            const content = document.querySelector(`.accordion-content[data-content="${accordionId}"]`);
            this.classList.toggle('active');
            if (content) content.classList.toggle('active');
        });
    }
}

function attachButtonFilters(filterType, selector) {
    const buttons = document.querySelectorAll(selector);
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function(ev) {
            const value = this.getAttribute(`data-${filterType}`);
            const parentSelector = selector.replace('.filter-btn', '');
            const allBtns = document.querySelectorAll(parentSelector);
            for (let j = 0; j < allBtns.length; j++) {
                allBtns[j].classList.remove('active');
            }
            this.classList.add('active');
            currentFilters[filterType] = value;
            updateActiveFiltersDisplay();
            triggerFilterChange();
        });
    }
}

function attachFilterEvents() {
    attachButtonFilters('pipe_mat', '#pipe_matFilters .filter-btn');
    attachButtonFilters('pipe_size', '#pipe_sizeFilters .filter-btn');
    attachButtonFilters('block_stat', '#block_statFilters .filter-btn');
    attachButtonFilters('class', '#classFilters .filter-btn');
    attachButtonFilters('inspector', '#inspectorFilters .filter-btn');
    attachButtonFilters('type', '#typeFilters .filter-btn');
    attachButtonFilters('length', '#lengthFilters .filter-btn');
    attachButtonFilters('suburb_nam', '#suburb_namFilters .filter-btn');
    attachButtonFilters('mh_depth', '#mh_depthFilters .filter-btn');
    attachButtonFilters('suburb_name', '#suburb_nameFilters .filter-btn');
    attachButtonFilters('township', '#townshipFilters .filter-btn');
    attachButtonFilters('op_zone', '#op_zoneFilters .filter-btn');
}

function updateTextFilter(filterType, value) {
    currentFilters[filterType] = value || '';
    updateActiveFiltersDisplay();
    triggerFilterChange();
}

function updateActiveFiltersDisplay() {
    const activeList = [];
    if (currentFilters.pipe_id && currentFilters.pipe_id !== 'all') activeList.push(`Pipe: ${currentFilters.pipe_id}`);
    if (currentFilters.pipe_mat !== 'all') activeList.push(`Material: ${currentFilters.pipe_mat}`);
    if (currentFilters.pipe_size !== 'all') activeList.push(`Size: ${currentFilters.pipe_size}mm`);
    if (currentFilters.block_stat !== 'all') activeList.push(`Status: ${currentFilters.block_stat}`);
    if (currentFilters.suburb_nam !== 'all') activeList.push(`Suburb: ${currentFilters.suburb_nam}`);
    if (currentFilters.search_text) activeList.push(`Search: ${currentFilters.search_text}`);
    
    const activeDiv = document.getElementById('activeFilters');
    if (activeDiv) {
        activeDiv.innerHTML = activeList.length === 0 ? 'No active filters (showing all)' : activeList.join(' | ');
    }
}

function triggerFilterChange() {
    const event = new CustomEvent('filtersChanged', {
        detail: { 
            filters: currentFilters,
            manholes: getFilteredManholes(),
            pipelines: getFilteredPipelines()
        }
    });
    document.dispatchEvent(event);
}

// ============================================
// 6. CLEAR ALL FILTERS
// ============================================

function clearAllFilters() {
    currentFilters = {
        pipe_id: 'all', pipe_mat: 'all', pipe_size: 'all', block_stat: 'all',
        class: 'all', inspector: 'all', type: 'all', length: 'all',
        start_mh: 'all', end_mh: 'all', manhole_id: 'all', mh_depth: 'all',
        mh_type: 'all', ground_lv: 'all', inv_lev: 'all', suburb_nam: 'all',
        bloc_stat_mh: 'all', suburb_name: 'all', township: 'all', ward: 'all',
        op_zone: 'all', short_name: 'all', search_text: '', date_from: 'all', date_to: 'all'
    };
    
    const allFilterGroups = document.querySelectorAll('.filter-buttons');
    for (let i = 0; i < allFilterGroups.length; i++) {
        const btns = allFilterGroups[i].querySelectorAll('.filter-btn');
        for (let j = 0; j < btns.length; j++) {
            btns[j].classList.remove('active');
            if (btns[j].textContent === 'ALL') btns[j].classList.add('active');
        }
    }
    
    const textInputs = document.querySelectorAll('.filter-input');
    for (let i = 0; i < textInputs.length; i++) {
        textInputs[i].value = '';
    }
    
    updateActiveFiltersDisplay();
    triggerFilterChange();
}

// ============================================
// 7. SQL WHERE CLAUSE BUILDER
// ============================================

function buildSQLWhereClause() {
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    if (currentFilters.pipe_id !== 'all') {
        conditions.push(`pipe_id ILIKE $${paramCount}`);
        params.push(`%${currentFilters.pipe_id}%`);
        paramCount++;
    }
    if (currentFilters.pipe_mat !== 'all') {
        conditions.push(`pipe_mat = $${paramCount}`);
        params.push(currentFilters.pipe_mat);
        paramCount++;
    }
    if (currentFilters.suburb_nam !== 'all') {
        conditions.push(`suburb_nam = $${paramCount}`);
        params.push(currentFilters.suburb_nam);
        paramCount++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
}

// ============================================
// 8. INITIALIZATION
// ============================================

function initFilters() {
    buildAccordionFilters();
    attachAccordionEvents();
    attachFilterEvents();
    updateActiveFiltersDisplay();
    
    const clearBtn = document.getElementById('clearAllFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFilters);
    }
}

// ============================================
// 9. EXPORTS (ES6 MODULE)
// ============================================

export default {
    init: initFilters,
    getCurrent: getCurrentFilters,
    getOptions: getFilterOptions,
    clearAll: clearAllFilters,
    buildSQLWhereClause: buildSQLWhereClause,
    getFilteredManholes: getFilteredManholes,
    getFilteredPipelines: getFilteredPipelines,
    getAllManholes: getAllManholes,
    getAllPipelines: getAllPipelines
};
