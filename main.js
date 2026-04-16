// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const Store = require('electron-store'); // This handles the local config file
const store = new Store();
let win;

function createWindow() {
    win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // CHECK: Does the user have a saved DB config?
    if (!store.has('db-config')) {
        win.loadFile('setup.html'); // Send them to the wizard
    } else {
        win.loadFile('index.html'); // Go straight to the GIS Dashboard
    }
}

// IPC Listener: Saves credentials from the setup screen
ipcMain.handle('save-config', async (event, config) => {
    try {
        // Test if the connection works before saving
        const { Pool } = require('pg');
        const pool = new Pool(config);
        await pool.query('SELECT NOW()'); 
        
        // If successful, save to the user's local AppData folder
        store.set('db-config', config);
        return { success: true };
    } catch (err) {
        return { success: false, error: err.message };
    }
});

app.whenReady().then(createWindow);
