// components/reports.js - Reports Component
// Handles PDF generation, CSV export, and report printing

// ============================================
// PDF GENERATION
// ============================================

function generatePDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council', 20, 20);
    
    doc.setFontSize(16);
    doc.text('Sewer Asset Management Report', 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 45);
    
    // Report content
    doc.setFontSize(12);
    doc.setTextColor(34, 139, 34);
    doc.text('Executive Summary', 20, 60);
    
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    const summaryText = 'This report provides an overview of sewer asset status, blockages, and maintenance activities.';
    doc.text(summaryText, 20, 70);
    
    // Add table
    const tableData = [
        ['Asset ID', 'Type', 'Suburb', 'Status', 'Blockages'],
        ['MH-001', 'Manhole', 'CBD', 'Critical', '12'],
        ['MH-002', 'Manhole', 'Sakubva', 'Warning', '5'],
        ['MH-003', 'Manhole', 'Dangamvura', 'Good', '3'],
        ['MH-004', 'Manhole', 'CBD', 'Critical', '15'],
        ['PL-001', 'Pipeline', 'CBD', 'Warning', '8'],
        ['PL-002', 'Pipeline', 'Sakubva', 'Good', '2']
    ];
    
    doc.autoTable({
        startY: 80,
        head: [tableData[0]],
        body: tableData.slice(1),
        theme: 'striped',
        headStyles: {
            fillColor: [34, 139, 34],
            textColor: [255, 255, 255],
            fontStyle: 'bold'
        },
        bodyStyles: {
            textColor: [50, 50, 50]
        },
        alternateRowStyles: {
            fillColor: [240, 255, 240]
        }
    });
    
    // Footer
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.setTextColor(34, 139, 34);
    doc.text('Mutare City Council - Sewer Management Department', 20, finalY);
    doc.text(`Report ID: MTR-${new Date().toISOString().slice(0,10).replace(/-/g, '')}`, 20, finalY + 5);
    
    // Save the PDF
    doc.save(`sewer_report_${new Date().toISOString().slice(0,10)}.pdf`);
}

// ============================================
// CSV EXPORT
// ============================================

function exportCSV() {
    // Sample data - in production, this would come from the current filtered data
    const csvData = [
        ['ID', 'Name', 'Type', 'Suburb', 'Diameter', 'Material', 'Status', 'Blockages', 'Last Inspection'],
        ['1', 'MH-001', 'Manhole', 'CBD', '150', 'Concrete', 'Critical', '12', '2026-04-15'],
        ['2', 'MH-002', 'Manhole', 'Sakubva', '100', 'PVC', 'Warning', '5', '2026-04-12'],
        ['3', 'MH-003', 'Manhole', 'Dangamvura', '80', 'Asbestos', 'Good', '3', '2026-04-01'],
        ['4', 'MH-004', 'Manhole', 'CBD', '120', 'Concrete', 'Critical', '15', '2026-04-14'],
        ['5', 'MH-005', 'Manhole', 'Chikanga', '130', 'Concrete', 'Warning', '7', '2026-04-10'],
        ['6', 'PL-001', 'Pipeline', 'CBD', '200', 'Concrete', 'Warning', '8', '2026-04-08'],
        ['7', 'PL-002', 'Pipeline', 'Sakubva', '150', 'PVC', 'Good', '2', '2026-03-28']
    ];
    
    // Convert to CSV string
    const csvString = csvData.map(row => row.join(',')).join('\n');
    
    // Create and download
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute('download', `sewer_assets_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

// ============================================
// EXPORT DATA AS JSON
// ============================================

function exportJSON() {
    const jsonData = {
        reportDate: new Date().toISOString(),
        version: '1.0',
        assets: [
            { id: 1, name: 'MH-001', type: 'manhole', suburb: 'CBD', status: 'critical', blockages: 12 },
            { id: 2, name: 'MH-002', type: 'manhole', suburb: 'Sakubva', status: 'warning', blockages: 5 },
            { id: 3, name: 'PL-001', type: 'pipeline', suburb: 'CBD', status: 'warning', blockages: 8 }
        ]
    };
    
    const jsonString = JSON.stringify(jsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sewer_data_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

// ============================================
// PRINT REPORT
// ============================================

function printReport() {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Mutare Sewer Report</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #228B22; }
                table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                th { background-color: #228B22; color: white; }
                .header { text-align: center; margin-bottom: 30px; }
                .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Mutare City Council</h1>
                <h2>Sewer Asset Management Report</h2>
                <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <table>
                <tr><th>Asset ID</th><th>Type</th><th>Suburb</th><th>Status</th><th>Blockages</th></tr>
                <tr><td>MH-001</td><td>Manhole</td><td>CBD</td><td>Critical</td><td>12</td></tr>
                <tr><td>MH-002</td><td>Manhole</td><td>Sakubva</td><td>Warning</td><td>5</td></tr>
                <tr><td>MH-003</td><td>Manhole</td><td>Dangamvura</td><td>Good</td><td>3</td></tr>
                <tr><td>PL-001</td><td>Pipeline</td><td>CBD</td><td>Warning</td><td>8</td></tr>
            </table>
            <div class="footer">
                <p>Mutare City Council - Sewer Management Department</p>
                <p>This is an official report. For inquiries, contact the Engineering Department.</p>
            </div>
        </body>
        </html>
    `);
    printWindow.document.close();
    printWindow.print();
}

// ============================================
// ATTACH EVENTS
// ============================================

function attachEvents() {
    const weeklyBtn = document.getElementById('weeklyReportBtn');
    const exportBtn = document.getElementById('exportCSVBtn');
    const printBtn = document.getElementById('printReportBtn');
    const exportJsonBtn = document.getElementById('exportJSONBtn');
    
    if (weeklyBtn) {
        weeklyBtn.addEventListener('click', generatePDF);
    }
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportCSV);
    }
    
    if (printBtn) {
        printBtn.addEventListener('click', printReport);
    }
    
    if (exportJsonBtn) {
        exportJsonBtn.addEventListener('click', exportJSON);
    }
}

// ============================================
// RENDER HTML
// ============================================

function render() {
    return `
        <div class="reports-container">
            <div class="chart-container">
                <h4>📄 GENERATE REPORTS</h4>
                <div class="report-buttons">
                    <button id="weeklyReportBtn" class="report-btn">
                        📊 Weekly Summary PDF
                    </button>
                    <button id="exportCSVBtn" class="report-btn">
                        📎 Export Data as CSV
                    </button>
                    <button id="exportJSONBtn" class="report-btn">
                        🔗 Export Data as JSON
                    </button>
                    <button id="printReportBtn" class="report-btn">
                        🖨️ Print Report
                    </button>
                </div>
            </div>
            <div class="chart-container">
                <h4>📋 REPORT HISTORY</h4>
                <div id="reportHistory">
                    <div class="stat-row">
                        <span>Weekly Report</span>
                        <span>Apr 15, 2026</span>
                    </div>
                    <div class="stat-row">
                        <span>Monthly Summary</span>
                        <span>Apr 01, 2026</span>
                    </div>
                    <div class="stat-row">
                        <span>Asset Export</span>
                        <span>Mar 30, 2026</span>
                    </div>
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
// UPDATE FUNCTION (for when filters change)
// ============================================

function updateReports(manholes, pipelines) {
    console.log('Reports component received updated data:', { manholes, pipelines });
    // In production, this would update the report data for export
}

// ============================================
// EXPORTS
// ============================================

export default {
    render,
    init,
    update: updateReports,
    generatePDF,
    exportCSV,
    printReport
};
