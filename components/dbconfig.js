// components/dbconfig.js - Database Configuration for Toolbar

function getConnectionStatusClass() {
    return '';
}

function getStatusDotClass() {
    return 'status-unknown';
}

async function checkDBStatus() {
    try {
        const response = await fetch('/api/system/db-status');
        const status = await response.json();
        
        const dbIcon = document.querySelector('.toolbar-db-icon');
        const statusDot = document.querySelector('.toolbar-db-status-dot');
        const dbStatusText = document.getElementById('toolbarDbStatusText');
        
        if (status.connected) {
            if (dbIcon) {
                dbIcon.classList.remove('disconnected', 'unknown');
                dbIcon.classList.add('connected');
            }
            if (statusDot) {
                statusDot.classList.remove('status-unknown', 'status-disconnected');
                statusDot.classList.add('status-connected');
            }
            if (dbStatusText) {
                dbStatusText.innerHTML = '✅ DB Connected';
                dbStatusText.style.color = '#28a745';
            }
        } else if (status.configured) {
            if (dbIcon) {
                dbIcon.classList.remove('connected', 'unknown');
                dbIcon.classList.add('disconnected');
            }
            if (statusDot) {
                statusDot.classList.remove('status-unknown', 'status-connected');
                statusDot.classList.add('status-disconnected');
            }
            if (dbStatusText) {
                dbStatusText.innerHTML = '⚠️ DB Disconnected';
                dbStatusText.style.color = '#ffc107';
            }
        } else {
            if (dbIcon) {
                dbIcon.classList.remove('connected', 'disconnected');
                dbIcon.classList.add('unknown');
            }
            if (statusDot) {
                statusDot.classList.remove('status-connected', 'status-disconnected');
                statusDot.classList.add('status-unknown');
            }
            if (dbStatusText) {
                dbStatusText.innerHTML = '🔌 Not Configured';
                dbStatusText.style.color = '#ffaa44';
            }
        }
    } catch (error) {
        console.error('Error checking DB status:', error);
    }
}

async function testConnection(config) {
    const response = await fetch('/api/system/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    });
    return response.json();
}

async function initializeDatabase(config) {
    const response = await fetch('/api/system/init-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    });
    return response.json();
}

async function saveDBConfig(config) {
    const response = await fetch('/api/system/db-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
    });
    return response.json();
}

function renderDBConfig() {
    return `
        <div class="toolbar-db-status" id="toolbarDbStatus">
            <div class="toolbar-db-icon-container">
                <div class="toolbar-db-icon unknown">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path d="M12 2C8 2 4 3.5 4 6v12c0 2.5 4 4 8 4s8-1.5 8-4V6c0-2.5-4-4-8-4z" fill="currentColor" opacity="0.3"/>
                        <path d="M12 2v20c-4 0-8-1.5-8-4V6c0-2.5 4-4 8-4z" fill="currentColor" opacity="0.6"/>
                        <path d="M12 10c4 0 8-1.5 8-4s-4-4-8-4-8 1.5-8 4 4 4 8 4z" fill="currentColor" opacity="0.8"/>
                        <circle cx="12" cy="10" r="2" fill="#0a1f0a"/>
                        <circle cx="12" cy="15" r="1.5" fill="#0a1f0a"/>
                    </svg>
                    <div class="toolbar-db-status-dot status-unknown"></div>
                </div>
                <span id="toolbarDbStatusText" class="toolbar-db-text">Checking...</span>
            </div>
            <button id="toolbarDbConfigBtn" class="toolbar-db-btn" title="Configure Database">
                ⚙️
            </button>
        </div>
        
        <!-- Database Configuration Modal -->
        <div id="dbModal" class="modal" style="display:none;">
            <div class="modal-content">
                <div class="modal-header">
                    <div class="pgadmin-icon">🐘</div>
                    <h3>PostgreSQL Connection Settings</h3>
                    <button id="closeDBModal" class="close-modal-btn">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="input-group">
                        <label>Host</label>
                        <input type="text" id="dbHost" placeholder="localhost" value="localhost">
                    </div>
                    <div class="input-group">
                        <label>Port</label>
                        <input type="text" id="dbPort" placeholder="5432" value="5432">
                    </div>
                    <div class="input-group">
                        <label>Username</label>
                        <input type="text" id="dbUser" placeholder="postgres">
                    </div>
                    <div class="input-group">
                        <label>Password</label>
                        <input type="password" id="dbPassword" placeholder="Enter password">
                    </div>
                    <div class="input-group">
                        <label>Database Name</label>
                        <input type="text" id="dbName" placeholder="sewer_management" value="sewer_management">
                    </div>
                    <div id="dbMessage" class="db-message"></div>
                </div>
                <div class="modal-footer">
                    <button id="testDBBtn" class="btn-secondary">🔌 Test Connection</button>
                    <button id="initDBBtn" class="btn-secondary">🚀 Initialize</button>
                    <button id="saveDBBtn" class="btn-primary">💾 Save & Connect</button>
                </div>
            </div>
        </div>
    `;
}

function initDBConfig() {
    const configureBtn = document.getElementById('toolbarDbConfigBtn');
    const modal = document.getElementById('dbModal');
    const closeBtn = document.getElementById('closeDBModal');
    const testBtn = document.getElementById('testDBBtn');
    const initBtn = document.getElementById('initDBBtn');
    const saveBtn = document.getElementById('saveDBBtn');
    const messageDiv = document.getElementById('dbMessage');
    
    if (configureBtn) {
        configureBtn.onclick = () => {
            modal.style.display = 'flex';
            messageDiv.innerHTML = '';
            loadSavedConfigToUI();
        };
    }
    
    if (closeBtn) {
        closeBtn.onclick = () => {
            modal.style.display = 'none';
        };
    }
    
    if (testBtn) {
        testBtn.onclick = async () => {
            const config = {
                host: document.getElementById('dbHost').value,
                port: parseInt(document.getElementById('dbPort').value),
                user: document.getElementById('dbUser').value,
                password: document.getElementById('dbPassword').value,
                database: document.getElementById('dbName').value
            };
            
            messageDiv.innerHTML = '<div class="loading-spinner">🔄 Testing connection...</div>';
            const result = await testConnection(config);
            
            if (result.connected) {
                messageDiv.innerHTML = '<div class="success-message">✅ Connection successful!</div>';
            } else {
                messageDiv.innerHTML = `<div class="error-message">❌ Connection failed: ${result.error}</div>`;
            }
        };
    }
    
    if (initBtn) {
        initBtn.onclick = async () => {
            const config = {
                host: document.getElementById('dbHost').value,
                port: parseInt(document.getElementById('dbPort').value),
                user: document.getElementById('dbUser').value,
                password: document.getElementById('dbPassword').value,
                database: document.getElementById('dbName').value
            };
            
            if (!confirm('This will create all database tables and extensions (PostGIS). Continue?')) return;
            
            messageDiv.innerHTML = '<div class="loading-spinner">🔄 Initializing database schema...</div>';
            const result = await initializeDatabase(config);
            
            if (result.success) {
                messageDiv.innerHTML = '<div class="success-message">✅ Database initialized successfully!</div>';
                setTimeout(() => {
                    modal.style.display = 'none';
                    checkDBStatus();
                }, 2000);
            } else {
                messageDiv.innerHTML = `<div class="error-message">❌ Error: ${result.error}</div>`;
            }
        };
    }
    
    if (saveBtn) {
        saveBtn.onclick = async () => {
            const config = {
                host: document.getElementById('dbHost').value,
                port: parseInt(document.getElementById('dbPort').value),
                user: document.getElementById('dbUser').value,
                password: document.getElementById('dbPassword').value,
                database: document.getElementById('dbName').value
            };
            
            messageDiv.innerHTML = '<div class="loading-spinner">🔄 Saving configuration...</div>';
            const result = await saveDBConfig(config);
            
            if (result.success) {
                messageDiv.innerHTML = '<div class="success-message">✅ Configuration saved!</div>';
                setTimeout(async () => {
                    const testResult = await testConnection(config);
                    if (testResult.connected) {
                        messageDiv.innerHTML = '<div class="success-message">✅ Connected to database!</div>';
                        setTimeout(() => {
                            modal.style.display = 'none';
                            checkDBStatus();
                        }, 1500);
                    } else {
                        messageDiv.innerHTML = `<div class="warning-message">⚠️ Saved but connection failed: ${testResult.error}</div>`;
                    }
                }, 500);
            } else {
                messageDiv.innerHTML = `<div class="error-message">❌ Error: ${result.error}</div>`;
            }
        };
    }
    
    // Click outside modal to close
    window.onclick = (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    // Initial status check
    checkDBStatus();
    // Check status every 30 seconds
    setInterval(checkDBStatus, 30000);
}

async function loadSavedConfigToUI() {
    try {
        const response = await fetch('/api/system/db-status');
        const status = await response.json();
        
        if (status.configured) {
            document.getElementById('dbHost').value = status.host || 'localhost';
            document.getElementById('dbPort').value = status.port || '5432';
            document.getElementById('dbUser').value = status.user || 'postgres';
            document.getElementById('dbName').value = status.database || 'sewer_management';
            document.getElementById('dbPassword').value = '';
        }
    } catch (error) {
        console.error('Error loading saved config:', error);
    }
}

export default {
    render: renderDBConfig,
    init: initDBConfig,
    checkStatus: checkDBStatus
};
