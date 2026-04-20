// components/hotspots.js - Hotspots Component

function updateProblemAssets(manholes) {
    const sorted = [...manholes].sort((a, b) => b.blockages - a.blockages).slice(0, 5);
    const container = document.getElementById('problemAssetsList');
    
    if (container) {
        if (sorted.length === 0) {
            container.innerHTML = '<div class="stat-row">No problem assets found</div>';
        } else {
            container.innerHTML = sorted.map(m => `
                <div class="stat-row">
                    <span>${m.name} - ${m.suburb}</span>
                    <span>${m.blockages} blockages</span>
                </div>
            `).join('');
        }
    }
}

export default {
    render() {
        return `
            <div class="chart-container">
                <h4>🔥 PROBLEM ASSETS (Top 5)</h4>
                <div id="problemAssetsList">
                    <div class="stat-row">Loading assets...</div>
                </div>
            </div>
        `;
    },
    init() {
        // Initial load with empty data
        updateProblemAssets([]);
    },
    update(manholes) {
        updateProblemAssets(manholes);
    }
};
