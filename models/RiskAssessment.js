// Risk score calculator for asset lifecycle tracking
// Higher score = higher risk of failure

function calculateRiskScore(ageYears, blockageCount, materialFactor) {
  // Normalise each factor to 0..1 and weight
  const ageWeight = 0.4;
  const blockageWeight = 0.4;
  const materialWeight = 0.2;

  const ageRisk = Math.min(ageYears / 50, 1.0);
  const blockageRisk = Math.min(blockageCount / 20, 1.0);
  // materialFactor: 1.0 = concrete, 1.5 = asbestos, 0.8 = PVC
  const materialRisk = Math.min(materialFactor, 2.0) / 2.0;

  const total = (ageRisk * ageWeight + blockageRisk * blockageWeight + materialRisk * materialWeight) * 100;
  return Math.round(total * 10) / 10;
}

async function getAssetProfile(assetId, pgClient) {
  // assetId can be manhole_id or pipe_id – adapt schema as needed
  const assetRes = await pgClient.query(
    `SELECT id, installation_date, material, material_factor 
     FROM assets WHERE id = $1`,
    [assetId]
  );
  if (assetRes.rows.length === 0) return null;

  const asset = assetRes.rows[0];
  const logsRes = await pgClient.query(
    `SELECT date, action FROM job_logs WHERE asset_id = $1 ORDER BY date DESC`,
    [assetId]
  );

  const ageYears = new Date().getFullYear() - new Date(asset.installation_date).getFullYear();
  const risk = calculateRiskScore(ageYears, logsRes.rows.length, asset.material_factor || 1.0);

  return {
    asset: {
      id: asset.id,
      installation_date: asset.installation_date,
      material: asset.material,
    },
    logs: logsRes.rows,
    risk: risk,
  };
}

module.exports = { calculateRiskScore, getAssetProfile };
