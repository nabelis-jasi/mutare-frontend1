const { app, BrowserWindow, ipcMain } = require('electron');
const { Pool } = require('pg');
const Store = require('electron-store');
const store = new Store();

let win;

function getPool() {
    const config = store.get('db-config');
    return new Pool(config);
}

function createWindow() {
    win = new BrowserWindow({
        width: 1400, height: 900,
        webPreferences: { nodeIntegration: true, contextIsolation: false }
    });

    if (!store.has('db-config')) {
        win.loadFile('setup.html');
    } else {
        win.loadFile('index.html');
    }
}

// Handler to save user's local Postgres info and create tables
ipcMain.handle('setup-db', async (event, config) => {
    try {
        const pool = new Pool(config);
        await pool.query(`
            CREATE EXTENSION IF NOT EXISTS postgis;
            CREATE TABLE IF NOT EXISTS assets (
                id SERIAL PRIMARY KEY,
                type VARCHAR(50), 
                status VARCHAR(20) DEFAULT 'operational',
                suburb VARCHAR(100),
                diameter INT,
                geom GEOMETRY(Point, 4326)
            );
            CREATE TABLE IF NOT EXISTS job_logs (
                id SERIAL PRIMARY KEY,
                asset_id INT,
                operator VARCHAR(100),
                action TEXT,
                status VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        store.set('db-config', config);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

// Fetch Real-time Stats for the Dashboard
ipcMain.handle('get-stats', async () => {
    const pool = getPool();
    try {
        const mh = await pool.query("SELECT COUNT(*) FROM assets WHERE type='manhole'");
        const pipes = await pool.query("SELECT COUNT(*) FROM assets WHERE type='pipeline'");
        const blocked = await pool.query("SELECT COUNT(*) FROM assets WHERE status='blocked'");
        const jobs = await pool.query("SELECT COUNT(*) FROM job_logs WHERE status='pending'");
        return {
            manholes: mh.rows[0].count,
            pipelines: pipes.rows[0].count,
            blocked: blocked.rows[0].count,
            jobs: jobs.rows[0].count
        };
    } finally { await pool.end(); }
});

// Run QGIS-style Analysis
ipcMain.handle('run-analysis', async (event, type) => {
    const pool = getPool();
    let sql = "SELECT * FROM assets";
    if (type === 'SMALL_PIPES') sql += " WHERE diameter < 150";
    if (type === 'BLOCKED') sql += " WHERE status = 'blocked'";
    const res = await pool.query(sql);
    await pool.end();
    return res.rows;
});

app.whenReady().then(createWindow);
