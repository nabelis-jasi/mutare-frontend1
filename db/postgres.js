const { Client } = require('pg');
const Store = require('electron-store');
const store = new Store();

let clientInstance = null;

async function getClient() {
  const creds = store.get('pg');
  if (!creds) throw new Error('No PostgreSQL credentials');
  if (!clientInstance || clientInstance._ending || clientInstance._closed) {
    clientInstance = new Client(creds);
    await clientInstance.connect();
  }
  return clientInstance;
}

async function query(sql, params = []) {
  const client = await getClient();
  const res = await client.query(sql, params);
  return res.rows;
}

module.exports = { getClient, query };
