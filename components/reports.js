// components/reports.js - Reports Component
// Handles PDF generation, CSV export, and report printing
// Based on actual database schema: waste_water_pipeline, waste_water_manhole, suburbs

// ============================================
// MOCK DATA BASED ON ACTUAL SCHEMA
// ============================================

// Pipeline data (waste_water_pipeline)
const mockPipelines = [
    { id: 1, pipe_id: '13373', start_mh: 'SKBMH267', end_mh: 'SKBSP018', pipe_mat: 'E/W', pipe_size: 150, class: 'Primary', block_stat: 'Partial', length: 4.35 },
    { id: 2, pipe_id: '36047', start_mh: 'GGMH001', end_mh: 'GGMH002', pipe_mat: 'PVC', pipe_size: 200, class: 'Secondary', block_stat: 'Clear', length: 12.5 },
    { id: 3, pipe_id: '45218', start_mh: 'MH-045', end_mh: 'MH-046', pipe_mat: 'Concrete', pipe_size: 300, class: 'Trunk', block_stat: 'Blocked', length: 25.8 }
];

// Manhole data (waste_water_manhole)
const mockManholes = [
    { manhole_id: 'GGMH001', mh_depth: 2.5, ground_lv: 1250.0, inv_lev: 1247.5, pipe_id: '36047', bloc_stat: 'Clear', class: 'Standard', inspector: 'John Smith', type: 'Access', suburb_nam: 'BORDERVALE 1' },
    { manhole_id: 'GGMH002', mh_depth: 3.2, ground_lv: 1252.0, inv_lev: 1248.8, pipe_id: '36047', bloc_stat: 'Partial', class: 'Deep', inspector: 'Mary Jones', type: 'Junction', suburb_nam: 'BORDERVALE 1' },
    { manhole_id: 'MH-045', mh_depth: 4.0, ground_lv: 1245.0, inv_lev: 1241.0, pipe_id: '45218', bloc_stat: 'Blocked', class: 'Standard', inspector: 'Peter Moyo', type: 'Drop', suburb_nam: 'CBD' }
];

// Suburb data
const mockSuburbs = [
    { gid: 4, suburb_name: 'BORDERVALE 1', township: 'UTALI', ward: 11, op_zone: 'TOWN', short_name: 'BDV' },
    { gid: 12, suburb_name: 'YEOVIL', township: 'UTALI', ward: 12, op_zone: 'TOWN', short_name: 'YVL' },
    { gid: 13, suburb_name: 'WESTLEA', township: 'UTALI', ward: 13, op_zone: 'TOWN', short_name: 'WES' }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

function getCurrentData() {
    // In production, this would fetch from global state or API
    return {
        pipelines: window.pipelineData || mockPipelines,
        manholes: window.manholeData || mockManholes,
        suburbs: window.suburbData || mockSuburbs
    };
}

// ============================================
// PIPELINE REPORT PDF
// ============================================

function generatePipelineReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const data = getCurrentData();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council', 20, 20);
    
    doc.setFontSize(16);
    doc.text('Waste Water Pipeline Report', 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
    doc.text(`Total Pipelines: ${data.pipelines.length}`, 20, 52);
    
    // Pipeline Table
    const pipelineTableData = [
        ['Pipe ID', 'Start MH', 'End MH', 'Material', 'Size (mm)', 'Class', 'Block Status', 'Length (m)']
    ];
    
    data.pipelines.forEach(p => {
        pipelineTableData.push([
            p.pipe_id || '—',
            p.start_mh || '—',
            p.end_mh || '—',
            p.pipe_mat || '—',
            p.pipe_size || '—',
            p.class || '—',
            p.block_stat || 'Normal',
            p.length ? p.length.toFixed(2) : '—'
        ]);
    });
    
    doc.autoTable({
        startY: 60,
        head: [pipelineTableData[0]],
        body: pipelineTableData.slice(1),
        theme: 'striped',
        headStyles: {
            fillColor: [34, 139, 34],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        bodyStyles: { textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [240, 255, 240] }
    });
    
    // Summary
    const finalY = doc.lastAutoTable.finalY + 10;
    const blockedCount = data.pipelines.filter(p => p.block_stat === 'Blocked').length;
    const partialCount = data.pipelines.filter(p => p.block_stat === 'Partial').length;
    
    doc.setFontSize(10);
    doc.setTextColor(34, 139, 34);
    doc.text('Summary', 20, finalY);
    doc.setTextColor(50, 50, 50);
    doc.text(`• Blocked Pipelines: ${blockedCount}`, 20, finalY + 7);
    doc.text(`• Partially Blocked: ${partialCount}`, 20, finalY + 14);
    doc.text(`• Clear Pipelines: ${data.pipelines.length - blockedCount - partialCount}`, 20, finalY + 21);
    
    // Footer
    doc.setFontSize(8);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council - Sewer Management Department', 20, finalY + 35);
    doc.text(`Report ID: PIPE-${new Date().toISOString().slice(0,10).replace(/-/g, '')}`, 20, finalY + 40);
    
    doc.save(`pipeline_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ============================================
// MANHOLE REPORT PDF
// ============================================

function generateManholeReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const data = getCurrentData();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council', 20, 20);
    
    doc.setFontSize(16);
    doc.text('Waste Water Manhole Report', 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
    doc.text(`Total Manholes: ${data.manholes.length}`, 20, 52);
    
    // Manhole Table
    const manholeTableData = [
        ['Manhole ID', 'Depth (m)', 'Ground LV', 'Invert LV', 'Pipe ID', 'Block Status', 'Class', 'Type', 'Suburb', 'Inspector']
    ];
    
    data.manholes.forEach(m => {
        manholeTableData.push([
            m.manhole_id || '—',
            m.mh_depth ? m.mh_depth + 'm' : '—',
            m.ground_lv || '—',
            m.inv_lev || '—',
            m.pipe_id || '—',
            m.bloc_stat || 'Normal',
            m.class || '—',
            m.type || '—',
            m.suburb_nam || '—',
            m.inspector || '—'
        ]);
    });
    
    doc.autoTable({
        startY: 60,
        head: [manholeTableData[0]],
        body: manholeTableData.slice(1),
        theme: 'striped',
        headStyles: {
            fillColor: [34, 139, 34],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        bodyStyles: { textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [240, 255, 240] }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council - Sewer Management Department', 20, finalY);
    doc.text(`Report ID: MH-${new Date().toISOString().slice(0,10).replace(/-/g, '')}`, 20, finalY + 5);
    
    doc.save(`manhole_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ============================================
// SUBURB REPORT PDF
// ============================================

function generateSuburbReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const data = getCurrentData();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council', 20, 20);
    
    doc.setFontSize(16);
    doc.text('Suburbs Report', 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
    doc.text(`Total Suburbs: ${data.suburbs.length}`, 20, 52);
    
    // Suburb Table
    const suburbTableData = [
        ['GID', 'Suburb Name', 'Township', 'Ward', 'Operational Zone', 'Short Name']
    ];
    
    data.suburbs.forEach(s => {
        suburbTableData.push([
            s.gid || '—',
            s.suburb_name || '—',
            s.township || '—',
            s.ward || '—',
            s.op_zone || '—',
            s.short_name || '—'
        ]);
    });
    
    doc.autoTable({
        startY: 60,
        head: [suburbTableData[0]],
        body: suburbTableData.slice(1),
        theme: 'striped',
        headStyles: {
            fillColor: [34, 139, 34],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        bodyStyles: { textColor: [50, 50, 50] },
        alternateRowStyles: { fillColor: [240, 255, 240] }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council - Sewer Management Department', 20, finalY);
    doc.text(`Report ID: SUB-${new Date().toISOString().slice(0,10).replace(/-/g, '')}`, 20, finalY + 5);
    
    doc.save(`suburb_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ============================================
// COMPREHENSIVE REPORT (All Data)
// ============================================

function generateComprehensiveReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('landscape');
    const data = getCurrentData();
    
    // Header
    doc.setFontSize(22);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council', 20, 20);
    
    doc.setFontSize(18);
    doc.text('Comprehensive Sewer Asset Report', 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
    
    // Executive Summary
    doc.setFontSize(12);
    doc.setTextColor(34, 139, 34);
    doc.text('Executive Summary', 20, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    const summaryText = `This comprehensive report provides an overview of all sewer assets in Mutare City Council's jurisdiction. 
Total pipelines: ${data.pipelines.length}, Total manholes: ${data.manholes.length}, Total suburbs: ${data.suburbs.length}.`;
    doc.text(summaryText, 20, 70, { maxWidth: 250 });
    
    // Pipeline Section
    let yPos = 90;
    doc.setFontSize(12);
    doc.setTextColor(34, 139, 34);
    doc.text('1. Waste Water Pipelines', 20, yPos);
    yPos += 10;
    
    const pipeTableData = [['Pipe ID', 'Material', 'Size', 'Class', 'Block Status']];
    data.pipelines.slice(0, 10).forEach(p => {
        pipeTableData.push([
            p.pipe_id || '—',
            p.pipe_mat || '—',
            p.pipe_size || '—',
            p.class || '—',
            p.block_stat || 'Normal'
        ]);
    });
    
    doc.autoTable({
        startY: yPos,
        head: [pipeTableData[0]],
        body: pipeTableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255] },
        bodyStyles: { textColor: [50, 50, 50] }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Manhole Section
    doc.setFontSize(12);
    doc.setTextColor(34, 139, 34);
    doc.text('2. Waste Water Manholes', 20, yPos);
    yPos += 10;
    
    const mhTableData = [['Manhole ID', 'Depth', 'Block Status', 'Type', 'Suburb']];
    data.manholes.slice(0, 10).forEach(m => {
        mhTableData.push([
            m.manhole_id || '—',
            m.mh_depth ? m.mh_depth + 'm' : '—',
            m.bloc_stat || 'Normal',
            m.type || '—',
            m.suburb_nam || '—'
        ]);
    });
    
    doc.autoTable({
        startY: yPos,
        head: [mhTableData[0]],
        body: mhTableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255] },
        bodyStyles: { textColor: [50, 50, 50] }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Suburb Section
    doc.setFontSize(12);
    doc.setTextColor(34, 139, 34);
    doc.text('3. Suburbs', 20, yPos);
    yPos += 10;
    
    const suburbTableData = [['Suburb Name', 'Township', 'Ward', 'Zone']];
    data.suburbs.forEach(s => {
        suburbTableData.push([
            s.suburb_name || '—',
            s.township || '—',
            s.ward || '—',
            s.op_zone || '—'
        ]);
    });
    
    doc.autoTable({
        startY: yPos,
        head: [suburbTableData[0]],
        body: suburbTableData.slice(1),
        theme: 'striped',
        headStyles: { fillColor: [34, 139, 34], textColor: [255, 255, 255] },
        bodyStyles: { textColor: [50, 50, 50] }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council - Sewer Management Department', 20, finalY);
    doc.text(`Report ID: MTR-${new Date().toISOString().slice(0,10).replace(/-/g, '')}`, 20, finalY + 5);
    
    doc.save(`comprehensive_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ============================================
// CSV EXPORT (All Data)
// ============================================

function exportPipelinesCSV() {
    const data = getCurrentData();
    const csvData = [['Pipe ID', 'Start MH', 'End MH', 'Material', 'Size (mm)', 'Class', 'Block Status', 'Length (m)']];
    
    data.pipelines.forEach(p => {
        csvData.push([
            p.pipe_id || '',
            p.start_mh || '',
            p.end_mh || '',
            p.pipe_mat || '',
            p.pipe_size || '',
            p.class || '',
            p.block_stat || '',
            p.length || ''
        ]);
    });
    
    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `pipelines_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportManholesCSV() {
    const data = getCurrentData();
    const csvData = [['Manhole ID', 'Depth (m)', 'Ground LV', 'Invert LV', 'Pipe ID', 'Block Status', 'Class', 'Type', 'Suburb', 'Inspector']];
    
    data.manholes.forEach(m => {
        csvData.push([
            m.manhole_id || '',
            m.mh_depth || '',
            m.ground_lv || '',
            m.inv_lev || '',
            m.pipe_id || '',
            m.bloc_stat || '',
            m.class || '',
            m.type || '',
            m.suburb_nam || '',
            m.inspector || ''
        ]);
    });
    
    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `manholes_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function exportSuburbsCSV() {
    const data = getCurrentData();
    const csvData = [['GID', 'Suburb Name', 'Township', 'Ward', 'Operational Zone', 'Short Name']];
    
    data.suburbs.forEach(s => {
        csvData.push([
            s.gid || '',
            s.suburb_name || '',
            s.township || '',
            s.ward || '',
            s.op_zone || '',
            s.short_name || ''
        ]);
    });
    
    const csvString = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `suburbs_${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ============================================
// ATTACH EVENTS
// ============================================

function attachEvents() {
    // Pipeline Reports
    const pipelineReportBtn = document.getElementById('pipelineReportBtn');
    if (pipelineReportBtn) pipelineReportBtn.addEventListener('click', generatePipelineReport);
    
    // Manhole Reports
    const manholeReportBtn = document.getElementById('manholeReportBtn');
    if (manholeReportBtn) manholeReportBtn.addEventListener('click', generateManholeReport);
    
    // Suburb Reports
    const suburbReportBtn = document.getElementById('suburbReportBtn');
    if (suburbReportBtn) suburbReportBtn.addEventListener('click', generateSuburbReport);
    
    // Comprehensive Report
    const comprehensiveBtn = document.getElementById('comprehensiveReportBtn');
    if (comprehensiveBtn) comprehensiveBtn.addEventListener('click', generateComprehensiveReport);
    
    // CSV Exports
    const exportPipelinesBtn = document.getElementById('exportPipelinesBtn');
    if (exportPipelinesBtn) exportPipelinesBtn.addEventListener('click', exportPipelinesCSV);
    
    const exportManholesBtn = document.getElementById('exportManholesBtn');
    if (exportManholesBtn) exportManholesBtn.addEventListener('click', exportManholesCSV);
    
    const exportSuburbsBtn = document.getElementById('exportSuburbsBtn');
    if (exportSuburbsBtn) exportSuburbsBtn.addEventListener('click', exportSuburbsCSV);
}

// ============================================
// RENDER HTML
// ============================================

function render() {
    return `
        <div class="reports-container">
            <div class="chart-container">
                <h4>📄 PIPELINE REPORTS</h4>
                <div class="report-buttons">
                    <button id="pipelineReportBtn" class="report-btn">
                        📊 Pipeline Summary PDF
                    </button>
                    <button id="exportPipelinesBtn" class="report-btn">
                        📎 Export Pipelines CSV
                    </button>
                </div>
            </div>
            
            <div class="chart-container">
                <h4>🕳️ MANHOLE REPORTS</h4>
                <div class="report-buttons">
                    <button id="manholeReportBtn" class="report-btn">
                        📊 Manhole Summary PDF
                    </button>
                    <button id="exportManholesBtn" class="report-btn">
                        📎 Export Manholes CSV
                    </button>
                </div>
            </div>
            
            <div class="chart-container">
                <h4>🏘️ SUBURB REPORTS</h4>
                <div class="report-buttons">
                    <button id="suburbReportBtn" class="report-btn">
                        📊 Suburb Summary PDF
                    </button>
                    <button id="exportSuburbsBtn" class="report-btn">
                        📎 Export Suburbs CSV
                    </button>
                </div>
            </div>
            
            <div class="chart-container">
                <h4>📑 COMPREHENSIVE REPORTS</h4>
                <div class="report-buttons">
                    <button id="comprehensiveReportBtn" class="report-btn">
                        📚 Full Asset Report PDF
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// INITIALIZATION
// ============================================

function init() {
    attachEvents();
}

// ============================================
// UPDATE FUNCTION
// ============================================

function updateReports(pipelines, manholes, suburbs) {
    if (pipelines) window.pipelineData = pipelines;
    if (manholes) window.manholeData = manholes;
    if (suburbs) window.suburbData = suburbs;
}

// ============================================
// EXPORTS
// ============================================

export default {
    render,
    init,
    update: updateReports,
    generatePipelineReport,
    generateManholeReport,
    generateSuburbReport,
    generateComprehensiveReport,
    exportPipelinesCSV,
    exportManholesCSV,
    exportSuburbsCSV
};
