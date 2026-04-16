const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const Store = require('electron-store');
const { Client } = require('pg');
const { getAssetProfile } = require('./models/RiskAssessment');
const { initOutbox, queueLog, syncOutboxToPostgres } = require('./db/sqlite_outbox');

const store = new Store();
let mainWindow;
let pgClient = null;

// Credential handling
ipcMain.handle('db:save-credentials', async (event, creds) => {
  store.set('pg', creds);
  // Test connection
  const testClient = new Client(creds);
  await testClient.connect();
  await testClient.end();
  return { success: true };
});

ipcMain.handle('db:get-credentials', () => {
  return store.get('pg') || null;
});

// Get a live PostgreSQL client (reuse or create new)
async function getPgClient() {
  const creds = store.get('pg');
  if (!creds) throw new Error('No credentials');
  if (!pgClient || pgClient._ending || pgClient._closed) {
    pgClient = new Client(creds);
    await pgClient.connect();
  }
  return pgClient;
}

// Generic query (for renderer)
ipcMain.handle('db:query', async (event, sql, params = []) => {
  const client = await getPgClient();
  const res = await client.query(sql, params);
  return res.rows;
});

// Queue a log (offline)
ipcMain.handle('db:queue-log', async (event, operation, tableName, data) => {
  queueLog(operation, tableName, data);
  return { queued: true };
});

// Sync offline outbox to PostgreSQL
ipcMain.handle('db:sync-now', async () => {
  const client = await getPgClient();
  await syncOutboxToPostgres(client);
  return { synced: true };
});

// Asset profile
ipcMain.handle('asset:profile', async (event, assetId) => {
  const client = await getPgClient();
  return await getAssetProfile(assetId, client);
});

// Create the window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'mutare_logo.png'),
  });
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  // Optional: open dev tools for debugging
  // mainWindow.webContents.openDevTools();
}

app.whenReady().then(() => {
  initOutbox(); // create SQLite outbox database
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
