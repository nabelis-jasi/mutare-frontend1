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
    length_min: 'all',        // minimum length
    length_max: 'all',        // maximum length
    start_mh: 'all',          // starting manhole
    end_mh: 'all',            // ending manhole
    
    // ===== MANHOLE FILTERS =====
    manhole_id: 'all',
    mh_depth_min: 'all',      // minimum depth
    mh_depth_max: 'all',      // maximum depth
    mh_type: 'all',           // manhole type
    ground_lv: 'all',         // ground level
    inv_lev: 'all',           // invert level
    suburb_nam: 'all',        // suburb name
    bloc_stat_mh: 'all',      // manhole blockage status
    
    // ===== SUBURB FILTERS =====
    suburb_name: 'all',
    township: 'all',          // UTALI, etc.
    ward: 'all',              // ward number
    op_zone: 'all',          // operational zone
    short_name: 'all',       // short code (BDV, YVL, WES)
    
    // ===== COMMON FILTERS =====
    search_text: '',          // text search across all fields
    date_from: 'all',         // inspection date from
    date_to: 'all'            // inspection date to
};

// ============================================
// 2. FILTER OPTIONS (from actual database)
// ============================================

const filterOptions = {
    // Pipeline material options
    pipe_materials: ['E/W', 'PVC', 'Concrete', 'Cast Iron', 'Asbestos', 'Clay', 'HDPE', 'Steel'],
    
    // Pipe size options (mm)
    pipe_sizes: [50, 75, 100, 150, 200, 250, 300, 375, 450, 525, 600, 750, 900, 1050, 1200],
    
    // Blockage status options
    block_statuses: [
        { value: 'blocked', label: 'BLOCKED - Critical', color: '#dc3545' },
        { value: 'partial', label: 'PARTIAL BLOCKAGE - Warning', color: '#ffc107' },
        { value: 'clear', label: 'CLEAR - Good', color: '#28a745' },
        { value: 'unknown', label: 'UNKNOWN - Needs Inspection', color: '#6c757d' }
    ],
    
    // Pipe classification
    pipe_classes: ['Primary', 'Secondary', 'Tertiary', 'Trunk', 'Branch', 'Lateral'],
    
    // Inspectors
    inspectors: ['John Smith', 'Mary Jones', 'Peter Moyo', 'Tendai Ncube', 'Charles Dube', 'Pending'],
    
    // Pipe types
    pipe_types: ['Gravity', 'Force Main', 'Vacuum', 'Siphon', 'Rising Main'],
    
    // Manhole types
    manhole_types: ['Standard', 'Deep', 'Drop', 'Access', 'Junction', 'Terminal'],
    
    // Suburbs (from database)
    suburbs: ['CBD', 'Sakubva', 'Dangamvura', 'Chikanga', 'Yeovil', 'BORDERVALE 1', 'WESTLEA', 'UTALI'],
    
    // Townships
    townships: ['UTALI', 'CBD', 'Sakubva', 'Dangamvura'],
    
    // Operational zones
    op_zones: ['TOWN', 'EAST', 'WEST', 'NORTH', 'SOUTH', 'INDUSTRIAL'],
    
    // Depth ranges (meters)
    depth_ranges: [
        { value: 'shallow', label: '< 2 m', min: 0, max: 2 },
        { value: 'medium', label: '2 - 4 m', min: 2, max: 4 },
        { value: 'deep', label: '> 4 m', min: 4, max: 100 }
    ],
    
    // Length ranges (meters)
    length_ranges: [
        { value: 'short', label: '< 50 m', min: 0, max: 50 },
        { value: 'medium', label: '50 - 100 m', min: 50, max: 100 },
        { value: 'long', label: '> 100 m', min: 100, max: 9999 }
    ]
};

// ============================================
// 3. BUILD ACCORDION FILTERS DYNAMICALLY
// ============================================

function buildAccordionFilters() {
    const container = document.getElementById('accordion-filters-container');
    if (!container) return;
    
    const filterSections = [
        // PIPELINE SECTION
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
        
        // MANHOLE SECTION
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
        
        // SUBURB SECTION
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
        
        // DATE & SEARCH SECTION
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
        
        // Main accordion section
        const accordionDiv = document.createElement('div');
        accordionDiv.className = 'accordion-section';
        
        // Header
        const header = document.createElement('div');
        header.className = 'accordion-header';
        header.setAttribute('data-accordion', section.id);
        header.innerHTML = `
            <span>${section.icon} ${section.title}</span>
            <span class="arrow">▶</span>
        `;
        
        // Content
        const content = document.createElement('div');
        content.className = 'accordion-content';
        content.setAttribute('data-content', section.id);
        
        const inner = document.createElement('div');
        inner.className = 'accordion-content-inner';
        
        // Add each filter group
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
                // Dropdown/button group
                const buttonsDiv = document.createElement('div');
                buttonsDiv.className = 'filter-buttons';
                buttonsDiv.id = `${group.type}Filters`;
                
                // Add ALL button
                const allBtn = document.createElement('button');
                allBtn.className = 'filter-btn active';
                allBtn.setAttribute(`data-${group.type}`, 'all');
                allBtn.textContent = 'ALL';
                buttonsDiv.appendChild(allBtn);
                
                // Add specific options
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
                        if (opt.color) {
                            btn.style.borderLeftColor = opt.color;
                        }
                    }
                    
                    buttonsDiv.appendChild(btn);
                }
                
                controlsDiv.appendChild(buttonsDiv);
            } else if (group.inputType) {
                // Text input or date input
                const input = document.createElement('input');
                input.type = group.inputType;
                input.className = 'filter-input';
                input.placeholder = group.placeholder || '';
                input.id = `${group.type}Input`;
                input.addEventListener('input', function() {
                    updateTextFilter(group.type, this.value);
                });
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
    
    // Open first accordion by default
    const firstHeader = document.querySelector('.accordion-header');
    if (firstHeader) {
        firstHeader.classList.add('active');
        const firstContent = document.querySelector('.accordion-content');
        if (firstContent) firstContent.classList.add('active');
    }
}

// ============================================
// 4. ATTACH EVENTS
// ============================================

function attachAccordionEvents() {
    const headers = document.querySelectorAll('.accordion-header');
    for (let i = 0; i < headers.length; i++) {
        headers[i].addEventListener('click', function() {
            const accordionId = this.getAttribute('data-accordion');
            const content = document.querySelector(`.accordion-content[data-content="${accordionId}"]`);
            this.classList.toggle('active');
            content.classList.toggle('active');
        });
    }
}

function attachFilterEvents() {
    // Pipeline filters
    attachButtonFilters('pipe_mat', '#pipe_matFilters');
    attachButtonFilters('pipe_size', '#pipe_sizeFilters');
    attachButtonFilters('block_stat', '#block_statFilters');
    attachButtonFilters('class', '#classFilters');
    attachButtonFilters('inspector', '#inspectorFilters');
    attachButtonFilters('type', '#typeFilters');
    attachButtonFilters('length', '#lengthFilters');
    attachButtonFilters('start_mh', '#start_mhFilters');
    attachButtonFilters('end_mh', '#end_mhFilters');
    
    // Manhole filters
    attachButtonFilters('manhole_id', '#manhole_idFilters');
    attachButtonFilters('mh_depth', '#mh_depthFilters');
    attachButtonFilters('mh_type', '#mh_typeFilters');
    attachButtonFilters('suburb_nam', '#suburb_namFilters');
    attachButtonFilters('bloc_stat_mh', '#bloc_stat_mhFilters');
    
    // Suburb filters
    attachButtonFilters('suburb_name', '#suburb_nameFilters');
    attachButtonFilters('township', '#townshipFilters');
    attachButtonFilters('op_zone', '#op_zoneFilters');
    attachButtonFilters('ward', '#wardFilters');
    attachButtonFilters('short_name', '#short_nameFilters');
}

function attachButtonFilters(filterType, selector) {
    const buttons = document.querySelectorAll(`${selector} .filter-btn`);
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].addEventListener('click', function() {
            const value = this.getAttribute(`data-${filterType}`);
            updateFilter(filterType, value, selector);
        });
    }
}

function updateFilter(filterType, value, selector) {
    // Update button active states
    const buttons = document.querySelectorAll(`${selector} .filter-btn`);
    for (let i = 0; i < buttons.length; i++) {
        buttons[i].classList.remove('active');
    }
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // Update filter state
    currentFilters[filterType] = value;
    
    // Update display
    updateActiveFiltersDisplay();
    
    // Trigger filter change
    triggerFilterChange();
}

function updateTextFilter(filterType, value) {
    currentFilters[filterType] = value || 'all';
    updateActiveFiltersDisplay();
    triggerFilterChange();
}

function updateActiveFiltersDisplay() {
    const activeList = [];
    
    // Pipeline active filters
    if (currentFilters.pipe_id !== 'all') activeList.push(`Pipe: ${currentFilters.pipe_id}`);
    if (currentFilters.pipe_mat !== 'all') activeList.push(`Material: ${currentFilters.pipe_mat}`);
    if (currentFilters.pipe_size !== 'all') activeList.push(`Size: ${currentFilters.pipe_size}mm`);
    if (currentFilters.block_stat !== 'all') activeList.push(`Status: ${currentFilters.block_stat}`);
    if (currentFilters.class !== 'all') activeList.push(`Class: ${currentFilters.class}`);
    if (currentFilters.inspector !== 'all') activeList.push(`Inspector: ${currentFilters.inspector}`);
    if (currentFilters.type !== 'all') activeList.push(`Type: ${currentFilters.type}`);
    if (currentFilters.length !== 'all') activeList.push(`Length: ${currentFilters.length}`);
    
    // Manhole active filters
    if (currentFilters.manhole_id !== 'all') activeList.push(`Manhole: ${currentFilters.manhole_id}`);
    if (currentFilters.mh_depth !== 'all') activeList.push(`Depth: ${currentFilters.mh_depth}`);
    if (currentFilters.mh_type !== 'all') activeList.push(`MH Type: ${currentFilters.mh_type}`);
    if (currentFilters.suburb_nam !== 'all') activeList.push(`Suburb: ${currentFilters.suburb_nam}`);
    
    // Suburb active filters
    if (currentFilters.suburb_name !== 'all') activeList.push(`Suburb Name: ${currentFilters.suburb_name}`);
    if (currentFilters.township !== 'all') activeList.push(`Township: ${currentFilters.township}`);
    if (currentFilters.op_zone !== 'all') activeList.push(`Zone: ${currentFilters.op_zone}`);
    
    // Search
    if (currentFilters.search_text && currentFilters.search_text !== 'all') activeList.push(`Search: ${currentFilters.search_text}`);
    if (currentFilters.date_from !== 'all') activeList.push(`From: ${currentFilters.date_from}`);
    if (currentFilters.date_to !== 'all') activeList.push(`To: ${currentFilters.date_to}`);
    
    const activeDiv = document.getElementById('activeFilters');
    if (activeDiv) {
        if (activeList.length === 0) {
            activeDiv.innerHTML = 'No active filters (showing all)';
        } else {
            activeDiv.innerHTML = activeList.join(' | ');
        }
    }
}

function triggerFilterChange() {
    const event = new CustomEvent('filtersChanged', {
        detail: { filters: currentFilters }
    });
    document.dispatchEvent(event);
}

// ============================================
// 5. FILTER LOGIC FOR DATABASE QUERIES
// ============================================

function buildSQLWhereClause() {
    const conditions = [];
    const params = [];
    let paramCount = 1;
    
    // Pipeline conditions
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
    if (currentFilters.pipe_size !== 'all') {
        conditions.push(`pipe_size = $${paramCount}`);
        params.push(parseInt(currentFilters.pipe_size));
        paramCount++;
    }
    if (currentFilters.block_stat !== 'all') {
        conditions.push(`block_stat = $${paramCount}`);
        params.push(currentFilters.block_stat);
        paramCount++;
    }
    
    // Manhole conditions
    if (currentFilters.manhole_id !== 'all') {
        conditions.push(`manhole_id ILIKE $${paramCount}`);
        params.push(`%${currentFilters.manhole_id}%`);
        paramCount++;
    }
    if (currentFilters.suburb_nam !== 'all') {
        conditions.push(`suburb_nam = $${paramCount}`);
        params.push(currentFilters.suburb_nam);
        paramCount++;
    }
    
    // Suburb conditions
    if (currentFilters.suburb_name !== 'all') {
        conditions.push(`suburb_name = $${paramCount}`);
        params.push(currentFilters.suburb_name);
        paramCount++;
    }
    if (currentFilters.township !== 'all') {
        conditions.push(`township = $${paramCount}`);
        params.push(currentFilters.township);
        paramCount++;
    }
    
    // Text search across multiple fields
    if (currentFilters.search_text && currentFilters.search_text !== 'all' && currentFilters.search_text !== '') {
        conditions.push(`(
            pipe_id ILIKE $${paramCount} OR 
            manhole_id ILIKE $${paramCount} OR 
            suburb_name ILIKE $${paramCount} OR 
            inspector ILIKE $${paramCount}
        )`);
        params.push(`%${currentFilters.search_text}%`);
        paramCount++;
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    return { whereClause, params };
}

// ============================================
// 6. CLEAR ALL FILTERS
// ============================================

function clearAllFilters() {
    // Reset all filter values
    currentFilters = {
        pipe_id: 'all',
        pipe_mat: 'all',
        pipe_size: 'all',
        block_stat: 'all',
        class: 'all',
        inspector: 'all',
        type: 'all',
        length: 'all',
        start_mh: 'all',
        end_mh: 'all',
        manhole_id: 'all',
        mh_depth: 'all',
        mh_type: 'all',
        suburb_nam: 'all',
        bloc_stat_mh: 'all',
        suburb_name: 'all',
        township: 'all',
        ward: 'all',
        op_zone: 'all',
        short_name: 'all',
        search_text: '',
        date_from: 'all',
        date_to: 'all'
    };
    
    // Reset all button active states
    const allFilterGroups = document.querySelectorAll('.filter-buttons');
    for (let i = 0; i < allFilterGroups.length; i++) {
        const btns = allFilterGroups[i].querySelectorAll('.filter-btn');
        for (let j = 0; j < btns.length; j++) {
            btns[j].classList.remove('active');
            if (btns[j].textContent === 'ALL') {
                btns[j].classList.add('active');
            }
        }
    }
    
    // Clear text inputs
    const textInputs = document.querySelectorAll('.filter-input');
    for (let i = 0; i < textInputs.length; i++) {
        textInputs[i].value = '';
    }
    
    updateActiveFiltersDisplay();
    triggerFilterChange();
}

// ============================================
// 7. EXPORT FUNCTIONS
// ============================================

function getCurrentFilters() {
    return currentFilters;
}

function getFilterOptions() {
    return filterOptions;
}

// ============================================
// 8. INITIALIZATION
// ============================================

function initFilters() {
    buildAccordionFilters();
    attachAccordionEvents();
    attachFilterEvents();
    updateActiveFiltersDisplay();
    
    // Clear all button
    const clearBtn = document.getElementById('clearAllFilters');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearAllFilters);
    }
}

// Export for use in other files
window.Filters = {
    init: initFilters,
    getCurrent: getCurrentFilters,
    getOptions: getFilterOptions,
    clearAll: clearAllFilters,
    buildSQLWhereClause: buildSQLWhereClause
};
