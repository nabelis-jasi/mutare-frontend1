// components/statistics.js - Statistics Component with Charts & Summary
// Fetches live data from Python Flask backend API

let suburbChart = null;
let jobsChart = null;
let statusChart = null;
let assetStatusChart = null;
let currentData = {
    manholesCount: 0,
    pipelinesCount: 0,
    complaintsCount: 0,
    criticalCount: 0,
    warningCount: 0,
    goodCount: 0,
    totalBlockages: 0,
    avgBlockages: 0,
    resolvedComplaints: 0,
    pendingComplaints: 0,
    completedJobs: 0,
    inProgressJobs: 0,
    manholesCritical: 0,
    manholesWarning: 0,
    manholesGood: 0,
    pipelinesCritical: 0,
    pipelinesWarning: 0,
    pipelinesGood: 0
};

const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// FETCH FUNCTIONS
// ============================================

async function fetchStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/summary`);
        if (!response.ok) throw new Error('Stats fetch failed');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching stats:', error);
        return null;
    }
}

async function fetchAssetStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/asset_status`);
        if (!response.ok) throw new Error('Asset status fetch failed');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching asset status:', error);
        return {
            manholes: { critical: 0, warning: 0, good: 0 },
            pipelines: { critical: 0, warning: 0, good: 0 }
        };
    }
}

async function fetchBlockagesBySuburb() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/blockages_by_suburb`);
        if (!response.ok) throw new Error('Blockages fetch failed');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching blockages by suburb:', error);
        return {
            suburbs: ['Sakubva', 'Chikanga', 'Dangamvura', 'Hobhouse', 'Yeovil'],
            blockages: [12, 8, 15, 5, 7]
        };
    }
}

async function fetchJobsSummary() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/jobs_summary`);
        if (!response.ok) throw new Error('Jobs summary fetch failed');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching jobs summary:', error);
        return {
            labels: ['Unblocking', 'Inspection', 'Repair', 'Maintenance'],
            counts: [45, 23, 12, 8]
        };
    }
}

async function fetchComplaintsStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/statistics/complaints_status`);
        if (!response.ok) throw new Error('Complaints status fetch failed');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching complaints status:', error);
        return { resolved: 0, pending: 0, total: 0 };
    }
}

// ============================================
// CHART INITIALIZATION
// ============================================

function initCharts() {
    // Blockages by Suburb Chart (Bar Chart)
    const suburbCtx = document.getElementById('suburbChart')?.getContext('2d');
    if (suburbCtx) {
        suburbChart = new Chart(suburbCtx, {
            type: 'bar',
            data: {
                labels: [],
                datasets: [{
                    label: 'Blockages',
                    data: [],
                    backgroundColor: '#228B22',
                    borderColor: '#2d8a2d',
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { labels: { color: '#a5d6a7', font: { size: 10 } } },
                    tooltip: { backgroundColor: '#1a2a27', titleColor: '#69f0ae', bodyColor: '#a5d6a7' }
                },
                scales: {
                    y: { 
                        beginAtZero: true, 
                        grid: { color: '#2a4a2a' }, 
                        ticks: { color: '#a5d6a7' },
                        title: { display: true, text: 'Number of Blockages', color: '#7cb342' }
                    },
                    x: { 
                        grid: { color: '#2a4a2a' }, 
                        ticks: { color: '#a5d6a7', rotation: 45, maxRotation: 45 },
                        title: { display: true, text: 'Suburb', color: '#7cb342' }
                    }
                }
            }
        });
    }

    // Jobs by Type Chart (Pie Chart)
    const jobsCtx = document.getElementById('jobsChart')?.getContext('2d');
    if (jobsCtx) {
        jobsChart = new Chart(jobsCtx, {
            type: 'pie',
            data: {
                labels: [],
                datasets: [{
                    data: [],
                    backgroundColor: ['#228B22', '#44aa44', '#66cc66', '#88dd88', '#aaffaa'],
                    borderColor: '#0a1f0a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#a5d6a7', font: { size: 10 } } },
                    tooltip: { backgroundColor: '#1a2a27', titleColor: '#69f0ae', bodyColor: '#a5d6a7' }
                }
            }
        });
    }
    
    // Complaints Status Chart (Doughnut Chart)
    const statusCtx = document.getElementById('statusChart')?.getContext('2d');
    if (statusCtx) {
        statusChart = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Resolved', 'Pending'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: ['#28a745', '#ffc107'],
                    borderColor: '#0a1f0a',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#a5d6a7', font: { size: 10 } } },
                    tooltip: { backgroundColor: '#1a2a27', titleColor: '#69f0ae', bodyColor: '#a5d6a7' }
                }
            }
        });
    }
    
    // Asset Status Chart (Stacked Bar)
    const assetCtx = document.getElementById('assetStatusChart')?.getContext('2d');
    if (assetCtx) {
        assetStatusChart = new Chart(assetCtx, {
            type: 'bar',
            data: {
                labels: ['Manholes', 'Pipelines'],
                datasets: [
                    {
                        label: '🔴 Critical',
                        data: [0, 0],
                        backgroundColor: '#dc3545',
                        borderRadius: 4
                    },
                    {
                        label: '🟡 Warning / Pending',
                        data: [0, 0],
                        backgroundColor: '#ffc107',
                        borderRadius: 4
                    },
                    {
                        label: '🟣 Manholes Normal / 🟢 Pipelines Normal',
                        data: [0, 0],
                        backgroundColor: ['#9b59b6', '#32cd32'],
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { 
                        position: 'bottom', 
                        labels: { color: '#a5d6a7', font: { size: 9 } }
                    },
                    tooltip: { backgroundColor: '#1a2a27', titleColor: '#69f0ae', bodyColor: '#a5d6a7' }
                },
                scales: {
                    x: { 
                        ticks: { color: '#a5d6a7', font: { weight: 'bold' } },
                        grid: { color: '#2a4a2a' }
                    },
                    y: { 
                        beginAtZero: true, 
                        ticks: { color: '#a5d6a7' },
                        grid: { color: '#2a4a2a' },
                        title: { display: true, text: 'Number of Assets', color: '#7cb342' },
                        stacked: true
                    }
                }
            }
        });
    }
}

// ============================================
// UPDATE FUNCTIONS
// ============================================

async function updateFromAPI() {
    // 1. Fetch general stats
    const stats = await fetchStats();
    if (stats) {
        currentData.manholesCount = stats.manholes || 0;
        currentData.pipelinesCount = stats.pipelines || 0;
        currentData.complaintsCount = stats.complaints || 0;
        currentData.totalBlockages = stats.total_blockages || 0;
        currentData.avgBlockages = stats.avg_blockages || 0;
        currentData.completedJobs = stats.completed_jobs || 0;
        currentData.inProgressJobs = stats.in_progress_jobs || 0;
        
        updateQuickSummaryDOM();
    }

    // 2. Fetch asset status
    const assetStatus = await fetchAssetStatus();
    if (assetStatus) {
        currentData.manholesCritical = assetStatus.manholes?.critical || 0;
        currentData.manholesWarning = assetStatus.manholes?.warning || 0;
        currentData.manholesGood = assetStatus.manholes?.good || 0;
        currentData.pipelinesCritical = assetStatus.pipelines?.critical || 0;
        currentData.pipelinesWarning = assetStatus.pipelines?.warning || 0;
        currentData.pipelinesGood = assetStatus.pipelines?.good || 0;
        
        currentData.criticalCount = currentData.manholesCritical + currentData.pipelinesCritical;
        currentData.warningCount = currentData.manholesWarning + currentData.pipelinesWarning;
        currentData.goodCount = currentData.manholesGood + currentData.pipelinesGood;
        
        updateAssetStatusChart();
        updateRiskBar();
    }

    // 3. Fetch blockages by suburb
    const blockagesData = await fetchBlockagesBySuburb();
    if (blockagesData && suburbChart) {
        suburbChart.data.labels = blockagesData.suburbs;
        suburbChart.data.datasets[0].data = blockagesData.blockages;
        suburbChart.update();
    }

    // 4. Fetch jobs summary
    const jobsData = await fetchJobsSummary();
    if (jobsData && jobsChart) {
        jobsChart.data.labels = jobsData.labels;
        jobsChart.data.datasets[0].data = jobsData.counts;
        jobsChart.update();
    }
    
    // 5. Fetch complaints status
    const complaintsStatus = await fetchComplaintsStatus();
    if (complaintsStatus && statusChart) {
        currentData.resolvedComplaints = complaintsStatus.resolved || 0;
        currentData.pendingComplaints = complaintsStatus.pending || 0;
        statusChart.data.datasets[0].data = [complaintsStatus.resolved || 0, complaintsStatus.pending || 0];
        statusChart.update();
        
        const resolvedEl = document.getElementById('resolvedComplaints');
        const pendingEl = document.getElementById('pendingComplaints');
        if (resolvedEl) resolvedEl.innerText = complaintsStatus.resolved || 0;
        if (pendingEl) pendingEl.innerText = complaintsStatus.pending || 0;
    }
}

function updateAssetStatusChart() {
    if (assetStatusChart) {
        assetStatusChart.data.datasets[0].data = [currentData.manholesCritical, currentData.pipelinesCritical];
        assetStatusChart.data.datasets[1].data = [currentData.manholesWarning, currentData.pipelinesWarning];
        assetStatusChart.data.datasets[2].data = [currentData.manholesGood, currentData.pipelinesGood];
        assetStatusChart.update();
    }
    
    const manholesCriticalEl = document.getElementById('manholesCritical');
    const manholesWarningEl = document.getElementById('manholesWarning');
    const manholesGoodEl = document.getElementById('manholesGood');
    const pipelinesCriticalEl = document.getElementById('pipelinesCritical');
    const pipelinesWarningEl = document.getElementById('pipelinesWarning');
    const pipelinesGoodEl = document.getElementById('pipelinesGood');
    
    if (manholesCriticalEl) manholesCriticalEl.innerText = currentData.manholesCritical;
    if (manholesWarningEl) manholesWarningEl.innerText = currentData.manholesWarning;
    if (manholesGoodEl) manholesGoodEl.innerText = currentData.manholesGood;
    if (pipelinesCriticalEl) pipelinesCriticalEl.innerText = currentData.pipelinesCritical;
    if (pipelinesWarningEl) pipelinesWarningEl.innerText = currentData.pipelinesWarning;
    if (pipelinesGoodEl) pipelinesGoodEl.innerText = currentData.pipelinesGood;
    
    const criticalAssetsDetail = document.getElementById('criticalAssetsDetail');
    const warningAssetsDetail = document.getElementById('warningAssetsDetail');
    const goodAssetsDetail = document.getElementById('goodAssetsDetail');
    if (criticalAssetsDetail) criticalAssetsDetail.innerText = currentData.criticalCount;
    if (warningAssetsDetail) warningAssetsDetail.innerText = currentData.warningCount;
    if (goodAssetsDetail) goodAssetsDetail.innerText = currentData.goodCount;
}

function updateQuickSummaryDOM() {
    const totalManholesEl = document.getElementById('totalManholes');
    const totalPipelinesEl = document.getElementById('totalPipelines');
    const totalComplaintsEl = document.getElementById('totalComplaints');
    const totalBlockagesEl = document.getElementById('totalBlockages');
    const avgBlockagesEl = document.getElementById('avgBlockages');
    const completedJobsEl = document.getElementById('completedJobs');
    const inProgressJobsEl = document.getElementById('inProgressJobs');
    const criticalAssetsEl = document.getElementById('criticalAssets');

    if (totalManholesEl) totalManholesEl.innerText = currentData.manholesCount;
    if (totalPipelinesEl) totalPipelinesEl.innerText = currentData.pipelinesCount;
    if (totalComplaintsEl) totalComplaintsEl.innerText = currentData.complaintsCount;
    if (totalBlockagesEl) totalBlockagesEl.innerText = currentData.totalBlockages;
    if (avgBlockagesEl) avgBlockagesEl.innerText = currentData.avgBlockages.toFixed(1);
    if (completedJobsEl) completedJobsEl.innerText = currentData.completedJobs;
    if (inProgressJobsEl) inProgressJobsEl.innerText = currentData.inProgressJobs;
    if (criticalAssetsEl) criticalAssetsEl.innerText = currentData.criticalCount;
}

function updateRiskBar() {
    const riskBar = document.getElementById('riskDistributionBar');
    if (!riskBar) return;
    
    const total = currentData.manholesCount + currentData.pipelinesCount;
    const criticalPercent = total > 0 ? (currentData.criticalCount / total) * 100 : 0;
    const warningPercent = total > 0 ? (currentData.warningCount / total) * 100 : 0;
    const goodPercent = total > 0 ? (currentData.goodCount / total) * 100 : 0;
    
    riskBar.innerHTML = `
        <div style="display: flex; height: 20px; border-radius: 10px; overflow: hidden; margin-top: 8px;">
            <div style="width: ${criticalPercent}%; background: #dc3545; transition: width 0.3s;" title="🔴 Critical: ${currentData.criticalCount}"></div>
            <div style="width: ${warningPercent}%; background: #ffc107; transition: width 0.3s;" title="🟡 Warning: ${currentData.warningCount}"></div>
            <div style="width: ${goodPercent}%; background: linear-gradient(90deg, #9b59b6 0%, #9b59b6 50%, #32cd32 50%, #32cd32 100%); transition: width 0.3s;" title="🟣 Good Manholes / 🟢 Good Pipelines: ${currentData.goodCount}"></div>
        </div>
        <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.6rem;">
            <span>🔴 Critical: ${currentData.criticalCount}</span>
            <span>🟡 Warning: ${currentData.warningCount}</span>
            <span>🟣🟢 Good: ${currentData.goodCount}</span>
        </div>
    `;
}

// ============================================
// MAIN UPDATE FUNCTION
// ============================================

async function updateStatistics() {
    await updateFromAPI();
    console.log('Statistics updated:', currentData);
}

function getCurrentStatistics() {
    return currentData;
}

// ============================================
// RENDER HTML
// ============================================

function render() {
    return `
        <div class="statistics-container">
            <!-- Row 1: Three Charts -->
            <div class="charts-row">
                <div class="chart-container">
                    <h4>📊 BLOCKAGES BY SUBURB</h4>
                    <canvas id="suburbChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>📋 JOBS BY TYPE</h4>
                    <canvas id="jobsChart"></canvas>
                </div>
                <div class="chart-container">
                    <h4>✅ COMPLAINTS STATUS</h4>
                    <canvas id="statusChart"></canvas>
                    <div style="text-align: center; margin-top: 8px;">
                        <span style="color: #28a745;">✓ Resolved: <span id="resolvedComplaints">0</span></span> | 
                        <span style="color: #ffc107;">⏳ Pending: <span id="pendingComplaints">0</span></span>
                    </div>
                </div>
            </div>
            
            <!-- Row 2: Asset Status Chart -->
            <div class="chart-container">
                <h4>🏭 ASSET HEALTH STATUS</h4>
                <p style="font-size: 0.6rem; color: #7cb342; margin-bottom: 8px;">
                    🟣 Manholes Normal = Purple | 🟢 Pipelines Normal = Lime Green
                </p>
                <canvas id="assetStatusChart"></canvas>
                <div class="asset-status-details">
                    <div class="asset-detail manhole-detail">
                        <strong>🟣 MANHOLES</strong>
                        <span>🔴 Critical: <span id="manholesCritical">0</span></span>
                        <span>🟡 Warning: <span id="manholesWarning">0</span></span>
                        <span>🟣 Normal: <span id="manholesGood">0</span></span>
                    </div>
                    <div class="asset-detail pipeline-detail">
                        <strong>🟢 PIPELINES</strong>
                        <span>🔴 Critical: <span id="pipelinesCritical">0</span></span>
                        <span>🟡 Warning: <span id="pipelinesWarning">0</span></span>
                        <span>🟢 Normal: <span id="pipelinesGood">0</span></span>
                    </div>
                </div>
            </div>
            
            <!-- Row 3: Quick Summary Grid -->
            <div class="chart-container">
                <h4>📈 QUICK SUMMARY</h4>
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-value" id="totalManholes">0</div>
                        <div class="summary-label">Total Manholes</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="totalPipelines">0</div>
                        <div class="summary-label">Total Pipelines</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="totalComplaints">0</div>
                        <div class="summary-label">Total Complaints</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="totalBlockages">0</div>
                        <div class="summary-label">Total Blockages</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="avgBlockages">0</div>
                        <div class="summary-label">Avg Blockages/Asset</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="completedJobs">0</div>
                        <div class="summary-label">Completed Jobs</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="inProgressJobs">0</div>
                        <div class="summary-label">In Progress Jobs</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-value" id="criticalAssets">0</div>
                        <div class="summary-label">Critical Assets</div>
                    </div>
                </div>
                
                <!-- Risk Distribution Bar -->
                <div style="margin-top: 16px;">
                    <div style="font-size: 0.7rem; margin-bottom: 4px; font-weight: bold; color: #7cb342;">⚠️ ASSET RISK DISTRIBUTION</div>
                    <div id="riskDistributionBar"></div>
                    <div style="display: flex; justify-content: space-between; margin-top: 6px; font-size: 0.6rem;">
                        <span>🔴 Critical: <span id="criticalAssetsDetail">0</span></span>
                        <span>🟡 Warning: <span id="warningAssetsDetail">0</span></span>
                        <span>🟣🟢 Good: <span id="goodAssetsDetail">0</span></span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    initCharts();
    await updateFromAPI();
    
    document.addEventListener('reportProcessed', () => {
        console.log('Report processed, refreshing statistics...');
        updateFromAPI();
    });
    
    document.addEventListener('layerToggled', () => {
        updateFromAPI();
    });
    
    document.addEventListener('dataRefreshed', () => {
        updateFromAPI();
    });
    
    document.addEventListener('assetStatusChanged', () => {
        console.log('Asset status changed, refreshing statistics...');
        updateFromAPI();
    });
    
    // Refresh every 5 minutes
    setInterval(() => {
        updateFromAPI();
    }, 300000);
    
    console.log('Statistics component initialized');
}

// ============================================
// EXPORTS
// ============================================

export default {
    render,
    init,
    update: updateStatistics,
    getCurrent: getCurrentStatistics
};