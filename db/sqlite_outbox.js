const Database = require('better-sqlite3');
const { app } = require('electron');
const path = require('path');

let db;

function initOutbox() {
  const userDataPath = app.getPath('userData');
  const dbPath = path.join(userDataPath, 'outbox.db');
  db = new Database(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS outbox (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operation TEXT NOT NULL,
      table_name TEXT NOT NULL,
      data TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      synced INTEGER DEFAULT 0
    )
  `);
  return db;
}

function queueLog(operation, tableName, data) {
  if (!db) initOutbox();
  const stmt = db.prepare(`INSERT INTO outbox (operation, table_name, data) VALUES (?, ?, ?)`);
  stmt.run(operation, tableName, JSON.stringify(data));
}

async function syncOutboxToPostgres(pgClient) {
  if (!db) initOutbox();
  const unsynced = db.prepare(`SELECT * FROM outbox WHERE synced = 0 ORDER BY id`).all();
  for (const row of unsynced) {
    try {
      const dataObj = JSON.parse(row.data);
      if (row.table_name === 'job_logs') {
        if (row.operation === 'INSERT') {
          await pgClient.query(
            `INSERT INTO job_logs (asset_id, job_type, action, resolution_time_hours, performed_by, notes)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [dataObj.asset_id, dataObj.job_type, dataObj.action, dataObj.resolution_time_hours, dataObj.performed_by, dataObj.notes]
          );
        }
      }
      db.prepare(`UPDATE outbox SET synced = 1 WHERE id = ?`).run(row.id);
    } catch (err) {
      console.error(`Failed to sync row ${row.id}:`, err);
    }
  }
}

module.exports = { initOutbox, queueLog, syncOutboxToPostgres };
