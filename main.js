const { Pool } = require('pg');

// Helper to get the saved config
function getPool() {
  const config = store.get('db-config');
  return new Pool(config);
}

// 1. Fetch Home Dashboard Stats
ipcMain.handle('get-dashboard-stats', async () => {
  const pool = getPool();
  try {
    const mh = await pool.query("SELECT COUNT(*) FROM assets WHERE type = 'manhole'");
    const pipes = await pool.query("SELECT COUNT(*) FROM assets WHERE type = 'pipeline'");
    const blocked = await pool.query("SELECT COUNT(*) FROM assets WHERE status = 'blocked'");
    const jobs = await pool.query("SELECT COUNT(*) FROM maintenance_logs WHERE status = 'pending'");
    
    return {
      manholes: mh.rows[0].count,
      pipelines: pipes.rows[0].count,
      blocked: blocked.rows[0].count,
      jobs: jobs.rows[0].count
    };
  } catch (err) {
    console.error(err);
    return null;
  } finally {
    await pool.end();
  }
});

// 2. Specialized Analysis (The "One-Click" Logic)
ipcMain.handle('run-analysis', async (event, type) => {
  const pool = getPool();
  let sql = "";
  
  if (type === 'SMALL_PIPES') sql = "SELECT * FROM assets WHERE type='pipeline' AND diameter < 150";
  if (type === 'SUBURB_VIEW') sql = "SELECT * FROM assets WHERE suburb = 'Mutare Central'"; // Example

  const res = await pool.query(sql);
  await pool.end();
  return res.rows;
});
