// components/hotspots.js - Advanced Spatial Analysis Component
// Now works with dynamic blockage inference from Flask backend data
// ============================================================

let currentAnalysis = null;
let selectedHotspot = null;
let drillDownLevel = 0;
let breadcrumbPath = [];

// ---------- HELPER: Get numeric blockage count from various field names ----------
function getBlockageCount(m) {
  // Direct numeric blockage field
  if (m.blockages !== undefined && typeof m.blockages === 'number') return m.blockages;
  if (m.blockage_count !== undefined && typeof m.blockage_count === 'number') return m.blockage_count;
  if (m.blockageScore !== undefined && typeof m.blockageScore === 'number') return m.blockageScore;
  
  // Infer from status text
  if (m.bloc_stat) {
    const status = String(m.bloc_stat).toLowerCase();
    if (status === 'blocked' || status === 'critical') return 3;
    if (status === 'partial' || status === 'warning') return 1;
    if (status === 'clear' || status === 'good') return 0;
  }
  if (m.status) {
    const status = String(m.status).toLowerCase();
    if (status === 'blocked' || status === 'critical') return 3;
    if (status === 'warning') return 1;
    if (status === 'good') return 0;
  }
  
  return 0; // default
}

// ---------- Spatial helpers ----------
function calculateCentroid(points) {
  if (!points.length) return { lat: 0, lng: 0 };
  const sumLat = points.reduce((sum, p) => sum + (p.lat || 0), 0);
  const sumLng = points.reduce((sum, p) => sum + (p.lng || 0), 0);
  return { lat: sumLat / points.length, lng: sumLng / points.length };
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// ---------- KERNEL DENSITY ESTIMATION ----------
function calculateKernelDensity(points, bandwidth = 0.5) {
  if (!points.length) return [];
  const densityPoints = [];
  const gridSize = 20;
  const lats = points.map(p => p.lat || 0);
  const lngs = points.map(p => p.lng || 0);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latStep = (maxLat - minLat) / gridSize;
  const lngStep = (maxLng - minLng) / gridSize;

  function gaussianKernel(distance, bandwidth) {
    return Math.exp(-0.5 * Math.pow(distance / bandwidth, 2)) / (bandwidth * Math.sqrt(2 * Math.PI));
  }

  for (let i = 0; i <= gridSize; i++) {
    for (let j = 0; j <= gridSize; j++) {
      const lat = minLat + i * latStep;
      const lng = minLng + j * lngStep;
      let density = 0;
      for (const point of points) {
        const distance = calculateDistance(lat, lng, point.lat || 0, point.lng || 0);
        density += gaussianKernel(distance, bandwidth) * getBlockageCount(point);
      }
      if (density > 0.01) densityPoints.push({ lat, lng, density });
    }
  }
  const maxDensity = Math.max(...densityPoints.map(d => d.density));
  densityPoints.forEach(d => d.normalizedDensity = (d.density / maxDensity) * 100);
  return densityPoints.sort((a, b) => b.density - a.density);
}

// ---------- GETIS-ORD GI* ----------
function calculateGetisOrdGi(points, distanceBand = 1.0) {
  if (!points.length) return [];
  const blockageValues = points.map(p => getBlockageCount(p));
  const totalBlockages = blockageValues.reduce((a,b) => a+b, 0);
  const meanBlockage = totalBlockages / points.length;
  let sumSquares = 0;
  for (let v of blockageValues) sumSquares += Math.pow(v - meanBlockage, 2);

  const results = [];
  for (let i = 0; i < points.length; i++) {
    let sumW = 0, sumWx = 0, sumW2 = 0;
    for (let j = 0; j < points.length; j++) {
      const dist = calculateDistance(points[i].lat || 0, points[i].lng || 0, points[j].lat || 0, points[j].lng || 0);
      const weight = dist <= distanceBand ? 1 : 0;
      if (weight) {
        sumW += weight;
        sumWx += weight * blockageValues[j];
        sumW2 += weight * weight;
      }
    }
    if (sumW > 0) {
      const numerator = sumWx - (sumW * meanBlockage);
      const denominator = Math.sqrt((sumSquares / (points.length - 1)) * ((points.length * sumW2 - Math.pow(sumW,2)) / (points.length - 1)));
      const giStar = denominator !== 0 ? numerator / denominator : 0;
      results.push({
        ...points[i],
        blockageScore: blockageValues[i],
        giStar: giStar,
        isHotspot: giStar > 1.96,
        significance: giStar > 2.58 ? '99%' : giStar > 1.96 ? '95%' : giStar > 1.65 ? '90%' : 'Not significant'
      });
    } else {
      results.push({ ...points[i], blockageScore: blockageValues[i], giStar: 0, isHotspot: false, significance: 'No neighbors' });
    }
  }
  return results.sort((a,b) => b.giStar - a.giStar);
}

// ---------- NEAREST NEIGHBOR ANALYSIS ----------
function calculateNearestNeighbor(points) {
  if (points.length < 2) return null;
  let totalDistances = 0, pairCount = 0;
  for (let i = 0; i < points.length; i++) {
    let minDist = Infinity;
    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        const dist = calculateDistance(points[i].lat || 0, points[i].lng || 0, points[j].lat || 0, points[j].lng || 0);
        if (dist < minDist) minDist = dist;
      }
    }
    if (minDist !== Infinity) { totalDistances += minDist; pairCount++; }
  }
  const meanObservedDist = totalDistances / pairCount;
  const lats = points.map(p => p.lat || 0);
  const lngs = points.map(p => p.lng || 0);
  const area = (Math.max(...lngs) - Math.min(...lngs)) * (Math.max(...lats) - Math.min(...lats));
  const expectedDist = 0.5 / Math.sqrt(points.length / area);
  const nnRatio = meanObservedDist / expectedDist;
  let pattern = nnRatio < 0.7 ? 'Clustered 🔴' : nnRatio > 1.3 ? 'Dispersed 🟢' : 'Random 🟡';
  return {
    meanDistance: meanObservedDist.toFixed(3),
    expectedDistance: expectedDist.toFixed(3),
    nnRatio: nnRatio.toFixed(3),
    pattern: pattern,
    interpretation: nnRatio < 0.7 ? 'Strong clustering detected' : nnRatio > 1.3 ? 'Dispersed pattern' : 'Random pattern – no significant clustering'
  };
}

// ---------- MORAN'S I ----------
function calculateMoransI(points, distanceBand = 1.0) {
  if (points.length < 2) return null;
  const values = points.map(p => getBlockageCount(p));
  const mean = values.reduce((a,b) => a+b,0) / values.length;
  let numerator = 0, denominator = 0, weightsSum = 0;
  for (let i = 0; i < points.length; i++) {
    denominator += Math.pow(values[i] - mean, 2);
    for (let j = 0; j < points.length; j++) {
      if (i !== j) {
        const dist = calculateDistance(points[i].lat || 0, points[i].lng || 0, points[j].lat || 0, points[j].lng || 0);
        const weight = dist <= distanceBand ? 1 : 0;
        if (weight > 0) {
          numerator += weight * (values[i] - mean) * (values[j] - mean);
          weightsSum += weight;
        }
      }
    }
  }
  const moransI = (points.length / weightsSum) * (numerator / denominator);
  let interpretation = '';
  if (moransI > 0.3) interpretation = 'Strong positive spatial autocorrelation – similar values cluster together 🔴';
  else if (moransI > 0.1) interpretation = 'Weak positive spatial autocorrelation 🟡';
  else if (moransI < -0.3) interpretation = 'Strong negative autocorrelation – checkerboard pattern 🟢';
  else interpretation = 'Random spatial distribution – no autocorrelation 📍';
  return { moransI: moransI.toFixed(3), interpretation };
}

// ---------- MAIN HOTSPOT DETECTION ----------
function detectHotspots(manholes) {
  if (!manholes || manholes.length === 0) {
    return { hotspots: [], stats: {}, clustering: null, kde: [], giResults: [], moran: null };
  }

  const blockageScores = manholes.map(m => getBlockageCount(m));
  const totalBlockages = blockageScores.reduce((a,b)=>a+b,0);
  const avgBlockages = totalBlockages / manholes.length;
  const stdDev = Math.sqrt(manholes.reduce((sum,m,i) => sum + Math.pow(blockageScores[i] - avgBlockages,2),0) / manholes.length);
  const threshold = avgBlockages + stdDev;
  const hotspots = manholes.filter((m,i) => blockageScores[i] > threshold).sort((a,b) => getBlockageCount(b) - getBlockageCount(a));

  return {
    hotspots: hotspots,
    stats: {
      totalBlockages: totalBlockages,
      avgBlockages: avgBlockages.toFixed(1),
      maxBlockages: Math.max(...blockageScores),
      stdDev: stdDev.toFixed(2),
      threshold: threshold.toFixed(2),
      hotspotCount: hotspots.length
    },
    clustering: calculateNearestNeighbor(manholes),
    kde: calculateKernelDensity(manholes, 0.5).slice(0,5),
    giResults: calculateGetisOrdGi(manholes, 1.0).filter(r => r.isHotspot).slice(0,5),
    moran: calculateMoransI(manholes, 1.0)
  };
}

// ---------- DRILL-DOWN FUNCTIONS ----------
function showHotspotDetails(hotspot, allManholes) {
  drillDownLevel = 1;
  selectedHotspot = hotspot;
  breadcrumbPath = ['Overview', `Hotspot: ${hotspot.manhole_id || hotspot.name || 'Asset'}`];
  const nearbyAssets = allManholes.filter(a => {
    const dist = calculateDistance(hotspot.lat || 0, hotspot.lng || 0, a.lat || 0, a.lng || 0);
    return dist <= 0.5 && a !== hotspot;
  });
  updateSpatialAnalysisWithDrillDown(allManholes, 'hotspot', { hotspot, nearbyAssets });
}

function showAssetDetails(asset, allManholes) {
  drillDownLevel = 2;
  breadcrumbPath = ['Overview', `Hotspot: ${selectedHotspot?.manhole_id || selectedHotspot?.name || 'Unknown'}`, `Asset: ${asset.manhole_id || asset.name}`];
  const similarAssets = allManholes.filter(a => (a.suburb === asset.suburb || a.suburb_nam === asset.suburb_nam) && a !== asset);
  updateSpatialAnalysisWithDrillDown(allManholes, 'asset', { asset, similarAssets });
}

function showDensityArea(area, allManholes) {
  drillDownLevel = 1;
  breadcrumbPath = ['Overview', `High Density Area (${area.normalizedDensity.toFixed(1)}%)`];
  const nearbyAssets = allManholes.filter(a => calculateDistance(area.lat, area.lng, a.lat || 0, a.lng || 0) <= 0.2);
  updateSpatialAnalysisWithDrillDown(allManholes, 'density', { area, nearbyAssets });
}

function showClusterDetails(cluster, allManholes) {
  drillDownLevel = 1;
  breadcrumbPath = ['Overview', `Statistical Cluster (${cluster.significance} confidence)`];
  const nearbyAssets = allManholes.filter(a => calculateDistance(cluster.lat || 0, cluster.lng || 0, a.lat || 0, a.lng || 0) <= 0.3);
  updateSpatialAnalysisWithDrillDown(allManholes, 'cluster', { cluster, nearbyAssets });
}

function goBackToOverview(allManholes) {
  drillDownLevel = 0;
  selectedHotspot = null;
  breadcrumbPath = ['Overview'];
  updateSpatialAnalysis(allManholes);
}

// ---------- DRILL-DOWN UI RENDER ----------
function updateSpatialAnalysisWithDrillDown(manholes, viewType, viewData) {
  const container = document.getElementById('spatialAnalysisStats');
  if (!container) return;

  const breadcrumbHtml = `
    <div class="breadcrumb-nav">
      ${breadcrumbPath.map((crumb, idx) => `
        <span class="breadcrumb-item ${idx === breadcrumbPath.length-1 ? 'active' : ''}">${crumb}</span>
        ${idx < breadcrumbPath.length-1 ? '<span class="breadcrumb-sep">›</span>' : ''}
      `).join('')}
      ${drillDownLevel > 0 ? '<button class="back-btn" id="backToOverviewBtn">← Back to Overview</button>' : ''}
    </div>
  `;

  if (viewType === 'hotspot' && viewData.hotspot) {
    const h = viewData.hotspot;
    container.innerHTML = `
      ${breadcrumbHtml}
      <div class="analysis-section hotspot-detail">
        <h5>🔥 HOTSPOT DETAILS</h5>
        <div class="detail-card">
          <div class="detail-row"><span>Asset ID:</span><strong>${h.manhole_id || h.name || 'N/A'}</strong></div>
          <div class="detail-row"><span>Location:</span>${h.suburb || h.suburb_nam || 'N/A'}</div>
          <div class="detail-row"><span>Blockage Score:</span><span class="hotspot-value">${getBlockageCount(h)}</span></div>
          <div class="detail-row"><span>Coordinates:</span>${(h.lat || 0).toFixed(6)}, ${(h.lng || 0).toFixed(6)}</div>
          <div class="detail-row"><span>Status:</span><span class="status-${h.status || 'unknown'}">${h.status || h.bloc_stat || 'Unknown'}</span></div>
          <button class="zoom-btn" data-lat="${h.lat}" data-lng="${h.lng}">📍 Zoom to Location</button>
          <button class="drilldown-btn" data-asset-id="${h.id}">🔍 View Nearby Assets (${viewData.nearbyAssets?.length || 0})</button>
        </div>
      </div>
      ${viewData.nearbyAssets?.length ? `
        <div class="analysis-section">
          <h5>📍 NEARBY ASSETS (within 500m)</h5>
          <div class="nearby-list">
            ${viewData.nearbyAssets.slice(0,10).map(a => `
              <div class="nearby-item" data-lat="${a.lat || 0}" data-lng="${a.lng || 0}" data-asset-id="${a.id}">
                <span>📌 ${a.manhole_id || a.name || 'Asset'}</span>
                <span class="blockage-badge">${getBlockageCount(a)} blockages</span>
                <button class="view-asset-btn">View →</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : '<div class="analysis-section"><div class="stat-row">No nearby assets found</div></div>'}
    `;
  } 
  else if (viewType === 'asset' && viewData.asset) {
    const a = viewData.asset;
    container.innerHTML = `
      ${breadcrumbHtml}
      <div class="analysis-section asset-detail">
        <h5>📍 ASSET DETAILS</h5>
        <div class="detail-card">
          <div class="detail-row"><span>Asset ID:</span><strong>${a.manhole_id || a.name || 'N/A'}</strong></div>
          <div class="detail-row"><span>Suburb:</span>${a.suburb || a.suburb_nam || 'N/A'}</div>
          <div class="detail-row"><span>Blockage Score:</span><span class="hotspot-value">${getBlockageCount(a)}</span></div>
          <div class="detail-row"><span>Coordinates:</span>${(a.lat || 0).toFixed(6)}, ${(a.lng || 0).toFixed(6)}</div>
          <div class="detail-row"><span>Diameter:</span>${a.diameter || 'N/A'} mm</div>
          <div class="detail-row"><span>Material:</span>${a.material || 'N/A'}</div>
          <button class="zoom-btn" data-lat="${a.lat}" data-lng="${a.lng}">📍 Zoom to Location</button>
        </div>
      </div>
      ${viewData.similarAssets?.length ? `
        <div class="analysis-section">
          <h5>🏘️ SIMILAR ASSETS IN ${a.suburb || a.suburb_nam || 'same suburb'}</h5>
          <div class="nearby-list">
            ${viewData.similarAssets.slice(0,10).map(s => `
              <div class="nearby-item" data-lat="${s.lat || 0}" data-lng="${s.lng || 0}">
                <span>📌 ${s.manhole_id || s.name || 'Asset'}</span>
                <span class="blockage-badge">${getBlockageCount(s)} blockages</span>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }
  else if (viewType === 'density' && viewData.area) {
    container.innerHTML = `
      ${breadcrumbHtml}
      <div class="analysis-section density-detail">
        <h5>🗺️ HIGH DENSITY AREA</h5>
        <div class="detail-card">
          <div class="detail-row"><span>Density Score:</span><span class="density-value">${viewData.area.normalizedDensity.toFixed(1)}%</span></div>
          <div class="detail-row"><span>Coordinates:</span>${(viewData.area.lat || 0).toFixed(6)}, ${(viewData.area.lng || 0).toFixed(6)}</div>
          <div class="detail-row"><span>Nearby Assets:</span>${viewData.nearbyAssets?.length || 0}</div>
          <button class="zoom-btn" data-lat="${viewData.area.lat}" data-lng="${viewData.area.lng}">📍 Zoom to Area</button>
        </div>
      </div>
      ${viewData.nearbyAssets?.length ? `
        <div class="analysis-section">
          <h5>📍 ASSETS IN THIS AREA</h5>
          <div class="nearby-list">
            ${viewData.nearbyAssets.slice(0,10).map(a => `
              <div class="nearby-item" data-lat="${a.lat || 0}" data-lng="${a.lng || 0}" data-asset-id="${a.id}">
                <span>📌 ${a.manhole_id || a.name || 'Asset'}</span>
                <span class="blockage-badge">${getBlockageCount(a)} blockages</span>
                <button class="view-asset-btn">View →</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }
  else if (viewType === 'cluster' && viewData.cluster) {
    container.innerHTML = `
      ${breadcrumbHtml}
      <div class="analysis-section cluster-detail">
        <h5>🎯 STATISTICAL CLUSTER</h5>
        <div class="detail-card">
          <div class="detail-row"><span>Asset:</span><strong>${viewData.cluster.manhole_id || viewData.cluster.name || 'Asset'}</strong></div>
          <div class="detail-row"><span>Gi* Score:</span>${viewData.cluster.giStar.toFixed(3)}</div>
          <div class="detail-row"><span>Confidence:</span><span class="confidence-${viewData.cluster.significance.replace('%','')}">${viewData.cluster.significance}</span></div>
          <div class="detail-row"><span>Nearby Assets:</span>${viewData.nearbyAssets?.length || 0}</div>
          <button class="zoom-btn" data-lat="${viewData.cluster.lat}" data-lng="${viewData.cluster.lng}">📍 Zoom to Cluster</button>
        </div>
      </div>
      ${viewData.nearbyAssets?.length ? `
        <div class="analysis-section">
          <h5>📍 ASSETS IN CLUSTER</h5>
          <div class="nearby-list">
            ${viewData.nearbyAssets.slice(0,10).map(a => `
              <div class="nearby-item" data-lat="${a.lat || 0}" data-lng="${a.lng || 0}" data-asset-id="${a.id}">
                <span>📌 ${a.manhole_id || a.name || 'Asset'}</span>
                <span class="blockage-badge">${getBlockageCount(a)} blockages</span>
                <button class="view-asset-btn">View →</button>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    `;
  }
  attachDrillDownEvents(manholes);
}

function updateSpatialAnalysis(manholes) {
  const analysis = detectHotspots(manholes);
  const container = document.getElementById('spatialAnalysisStats');
  if (!container) return;
  if (!manholes.length) {
    container.innerHTML = '<div class="stat-row">No data available for spatial analysis</div>';
    return;
  }
  container.innerHTML = `
    ${drillDownLevel > 0 ? `
      <div class="breadcrumb-nav">
        ${breadcrumbPath.map((crumb, idx) => `
          <span class="breadcrumb-item ${idx === breadcrumbPath.length-1 ? 'active' : ''}">${crumb}</span>
          ${idx < breadcrumbPath.length-1 ? '<span class="breadcrumb-sep">›</span>' : ''}
        `).join('')}
        <button class="back-btn" id="backToOverviewBtn">← Back to Overview</button>
      </div>
    ` : ''}
    <div class="analysis-section">
      <h5>📊 Blockage Statistics</h5>
      <div class="stat-row"><span>Total Blockage Score:</span><span>${analysis.stats.totalBlockages}</span></div>
      <div class="stat-row"><span>Average per Asset:</span><span>${analysis.stats.avgBlockages}</span></div>
      <div class="stat-row"><span>Maximum:</span><span>${analysis.stats.maxBlockages}</span></div>
      <div class="stat-row"><span>Std Deviation:</span><span>${analysis.stats.stdDev}</span></div>
      <div class="stat-row"><span>Hotspot Threshold:</span><span>> ${analysis.stats.threshold}</span></div>
      <div class="stat-row"><span>🔥 Hotspots Found:</span><span class="hotspot-count">${analysis.stats.hotspotCount}</span></div>
    </div>
    <div class="analysis-section">
      <h5>📍 Nearest Neighbor Analysis</h5>
      <div class="stat-row"><span>Mean Distance:</span><span>${analysis.clustering?.meanDistance || 'N/A'} km</span></div>
      <div class="stat-row"><span>Expected Distance:</span><span>${analysis.clustering?.expectedDistance || 'N/A'} km</span></div>
      <div class="stat-row"><span>NN Ratio:</span><span>${analysis.clustering?.nnRatio || 'N/A'}</span></div>
      <div class="stat-row"><span>Pattern:</span><span class="pattern-${analysis.clustering?.nnRatio < 0.7 ? 'clustered' : analysis.clustering?.nnRatio > 1.3 ? 'dispersed' : 'random'}">${analysis.clustering?.pattern || 'N/A'}</span></div>
      <div class="interpretation-text">${analysis.clustering?.interpretation || ''}</div>
    </div>
    <div class="analysis-section">
      <h5>🔄 Spatial Autocorrelation (Moran's I)</h5>
      <div class="stat-row"><span>Moran's I:</span><span>${analysis.moran?.moransI || 'N/A'}</span></div>
      <div class="interpretation-text">${analysis.moran?.interpretation || ''}</div>
    </div>
    <div class="analysis-section">
      <h5>🎯 Significant Clusters (Getis-Ord Gi*)</h5>
      ${analysis.giResults.length ? `
        <div class="cluster-list">
          ${analysis.giResults.map(r => `
            <div class="cluster-item" data-lat="${r.lat || 0}" data-lng="${r.lng || 0}" data-asset-id="${r.id}">
              <span>📍 ${r.manhole_id || r.name || 'Asset'}</span>
              <span class="confidence-${r.significance.replace('%','')}">${r.significance} confidence</span>
              <button class="view-cluster-btn">View Cluster →</button>
            </div>
          `).join('')}
        </div>
      ` : '<div class="stat-row">No significant clusters detected</div>'}
    </div>
    <div class="analysis-section">
      <h5>🗺️ High Density Areas (KDE)</h5>
      ${analysis.kde.length ? analysis.kde.map(area => `
        <div class="density-item" data-lat="${area.lat}" data-lng="${area.lng}">
          <span>📍 Density: ${area.normalizedDensity.toFixed(1)}%</span>
          <div class="density-bar-container"><div class="density-bar" style="width: ${area.normalizedDensity}%"></div></div>
          <button class="view-density-btn">View Area →</button>
        </div>
      `).join('') : '<div class="stat-row">No density areas detected</div>'}
    </div>
  `;
  attachDrillDownEvents(manholes);
}

function attachDrillDownEvents(manholes) {
  const backBtn = document.getElementById('backToOverviewBtn');
  if (backBtn) backBtn.onclick = () => goBackToOverview(manholes);

  document.querySelectorAll('.zoom-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const lat = parseFloat(this.dataset.lat);
      const lng = parseFloat(this.dataset.lng);
      if (!isNaN(lat) && !isNaN(lng))
        document.dispatchEvent(new CustomEvent('zoomToLocation', { detail: { lat, lng, zoom: 18 } }));
    });
  });

  document.querySelectorAll('.view-asset-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.closest('.nearby-item');
      if (parent) {
        const lat = parseFloat(parent.dataset.lat);
        const lng = parseFloat(parent.dataset.lng);
        const assetId = parent.dataset.assetId;
        const asset = manholes.find(a => a.id == assetId);
        if (asset) showAssetDetails(asset, manholes);
        else if (!isNaN(lat) && !isNaN(lng))
          document.dispatchEvent(new CustomEvent('zoomToLocation', { detail: { lat, lng, zoom: 18 } }));
      }
    });
  });

  document.querySelectorAll('.view-cluster-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.closest('.cluster-item');
      if (parent) {
        const lat = parseFloat(parent.dataset.lat);
        const lng = parseFloat(parent.dataset.lng);
        const assetId = parent.dataset.assetId;
        const cluster = manholes.find(a => a.id == assetId);
        if (cluster) showClusterDetails(cluster, manholes);
      }
    });
  });

  document.querySelectorAll('.view-density-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const parent = this.closest('.density-item');
      if (parent) {
        const lat = parseFloat(parent.dataset.lat);
        const lng = parseFloat(parent.dataset.lng);
        const density = { lat, lng, normalizedDensity: parseFloat(parent.querySelector('.density-bar')?.style.width || '0') };
        showDensityArea(density, manholes);
      }
    });
  });

  document.querySelectorAll('.hotspot-item').forEach(item => {
    item.addEventListener('click', function() {
      const lat = parseFloat(this.dataset.lat);
      const lng = parseFloat(this.dataset.lng);
      const asset = manholes.find(a => Math.abs((a.lat || 0) - lat) < 0.0001 && Math.abs((a.lng || 0) - lng) < 0.0001);
      if (asset) showHotspotDetails(asset, manholes);
      else if (!isNaN(lat) && !isNaN(lng))
        document.dispatchEvent(new CustomEvent('zoomToLocation', { detail: { lat, lng, zoom: 18 } }));
    });
  });
}

function attachHotspotClickEvents() {
  document.querySelectorAll('.hotspot-item').forEach(item => {
    item.removeEventListener('click', item.clickHandler);
    const handler = function() {
      const lat = parseFloat(this.dataset.lat);
      const lng = parseFloat(this.dataset.lng);
      if (!isNaN(lat) && !isNaN(lng))
        document.dispatchEvent(new CustomEvent('zoomToLocation', { detail: { lat, lng, zoom: 18 } }));
    };
    item.clickHandler = handler;
    item.addEventListener('click', handler);
  });
}

function updateProblemAssets(manholes) {
  const analysis = detectHotspots(manholes);
  const container = document.getElementById('problemAssetsList');
  if (container) {
    if (!analysis.hotspots.length) {
      container.innerHTML = '<div class="stat-row">✅ No significant hotspots detected</div>';
    } else {
      container.innerHTML = analysis.hotspots.slice(0,5).map(m => `
        <div class="stat-row hotspot-item" data-lat="${m.lat || 0}" data-lng="${m.lng || 0}" data-asset-id="${m.id}">
          <span>🔥 ${m.manhole_id || m.name || 'Asset'} - ${m.suburb || m.suburb_nam || 'N/A'}</span>
          <span class="hotspot-value">${getBlockageCount(m)} blockages</span>
          <button class="view-details-btn">Details →</button>
        </div>
      `).join('');
    }
  }
  attachHotspotClickEvents();
  attachDrillDownEvents(manholes);
}

function updateStatistics(manholes) {
  const analysis = detectHotspots(manholes);
  const statsContainer = document.getElementById('hotspotStats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat-row"><span>📊 Total Blockage Score:</span><span>${analysis.stats.totalBlockages}</span></div>
      <div class="stat-row"><span>📈 Average per Asset:</span><span>${analysis.stats.avgBlockages}</span></div>
      <div class="stat-row"><span>⚠️ Worst Blockage:</span><span>${analysis.stats.maxBlockages}</span></div>
      <div class="stat-row"><span>🔥 Hotspots Detected:</span><span class="hotspot-count">${analysis.stats.hotspotCount}</span></div>
    `;
  }
}

// ---------- RENDER & EXPORTS ----------
function render() {
  return `
    <div class="hotspots-container">
      <div class="chart-container">
        <h4>🔥 PROBLEM ASSETS (Top 5 Hotspots)</h4>
        <div id="problemAssetsList" class="hotspot-list"><div class="stat-row">📋 Loading assets...</div></div>
      </div>
      <div class="chart-container">
        <h4>📊 SPATIAL ANALYSIS REPORT</h4>
        <div id="spatialAnalysisStats"><div class="stat-row">Loading spatial analysis...</div></div>
      </div>
      <div class="chart-container">
        <h4>📈 SUMMARY STATISTICS</h4>
        <div id="hotspotStats"><div class="stat-row">Loading statistics...</div></div>
      </div>
    </div>
  `;
}

function init() {
  updateProblemAssets([]);
  updateSpatialAnalysis([]);
  updateStatistics([]);
}

function update(manholes) {
  if (manholes && manholes.length) {
    updateProblemAssets(manholes);
    updateSpatialAnalysis(manholes);
    updateStatistics(manholes);
  } else {
    updateProblemAssets([]);
    updateSpatialAnalysis([]);
    updateStatistics([]);
  }
}

export default {
  render,
  init,
  update
};