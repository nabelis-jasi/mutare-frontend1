async function checkFirstRun() {
  const creds = await window.electron.getCredentials();
  if (!creds) {
    document.getElementById('wizard').style.display = 'block';
    document.getElementById('app').style.display = 'none';
  } else {
    document.getElementById('wizard').style.display = 'none';
    document.getElementById('app').style.display = 'block';
    initApp(creds);
  }
}

document.getElementById('save-creds').addEventListener('click', async () => {
  const creds = {
    host: document.getElementById('pg-host').value,
    port: document.getElementById('pg-port').value,
    user: document.getElementById('pg-user').value,
    password: document.getElementById('pg-password').value,
    database: document.getElementById('pg-db').value
  };
  await window.electron.saveCredentials(creds);
  checkFirstRun();
});
