import React, { useState, useEffect } from 'react';
import api from '../../api/api';

export default function ConnectionsPanel({ onClose, onConnectionActivated }) {
    const [connections, setConnections] = useState([]);
    const [loading, setLoading] = useState(true);
    const [testing, setTesting] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState({
        name: '',
        pg_host: 'localhost',
        pg_port: 5432,
        pg_database: '',
        pg_user: 'postgres',
        pg_password: '',
        geoserver_url: 'http://localhost:8080/geoserver/wms'
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        setLoading(true);
        try {
            const res = await api.get('/connections');
            setConnections(res.data);
        } catch (err) {
            console.error('Error fetching connections', err);
            showMessage('Failed to load connections', 'error');
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (msg, type) => {
        setMessage(msg);
        setMessageType(type);
        setTimeout(() => {
            setMessage('');
            setMessageType('');
        }, 5000);
    };

    const testConnection = async () => {
        setTesting(true);
        try {
            const res = await api.post('/connections/test', {
                pg_host: form.pg_host,
                pg_port: form.pg_port,
                pg_database: form.pg_database,
                pg_user: form.pg_user,
                pg_password: form.pg_password
            });
            if (res.data.success) {
                showMessage('✓ Connection successful!', 'success');
            }
        } catch (err) {
            showMessage(`✗ Connection failed: ${err.response?.data?.error || err.message}`, 'error');
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/connections/${editingId}`, form);
                showMessage('Connection updated successfully', 'success');
            } else {
                await api.post('/connections', form);
                showMessage('Connection created successfully', 'success');
                // Reset form
                setForm({
                    name: '',
                    pg_host: 'localhost',
                    pg_port: 5432,
                    pg_database: '',
                    pg_user: 'postgres',
                    pg_password: '',
                    geoserver_url: 'http://localhost:8080/geoserver/wms'
                });
            }
            setEditingId(null);
            await fetchConnections();
        } catch (err) {
            showMessage(`Error: ${err.response?.data?.error || err.message}`, 'error');
        } finally {
            setSaving(false);
        }
    };

    const activateConnection = async (id) => {
        try {
            await api.put(`/connections/${id}/activate`);
            showMessage('Connection activated', 'success');
            await fetchConnections();
            if (onConnectionActivated) onConnectionActivated();
        } catch (err) {
            showMessage('Error activating connection', 'error');
        }
    };

    const deleteConnection = async (id) => {
        if (!confirm('Delete this connection? This cannot be undone.')) return;
        try {
            await api.delete(`/connections/${id}`);
            showMessage('Connection deleted', 'success');
            await fetchConnections();
        } catch (err) {
            showMessage('Error deleting connection', 'error');
        }
    };

    const editConnection = (conn) => {
        setEditingId(conn.id);
        setForm({
            name: conn.name,
            pg_host: conn.pg_host,
            pg_port: conn.pg_port,
            pg_database: conn.pg_database,
            pg_user: conn.pg_user,
            pg_password: conn.pg_password,
            geoserver_url: conn.geoserver_url
        });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm({
            name: '',
            pg_host: 'localhost',
            pg_port: 5432,
            pg_database: '',
            pg_user: 'postgres',
            pg_password: '',
            geoserver_url: 'http://localhost:8080/geoserver/wms'
        });
    };

    return (
        <div className="connections-panel">
            <div className="panel-header">
                <h2>🔌 Database Connections</h2>
                <button className="close-btn" onClick={onClose}>×</button>
            </div>
            
            <div className="panel-content">
                {/* Connection Form */}
                <div className="form-section">
                    <h3>{editingId ? 'Edit Connection' : 'New Connection'}</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Connection Name *</label>
                            <input 
                                type="text" 
                                value={form.name} 
                                onChange={e => setForm({...form, name: e.target.value})}
                                placeholder="e.g., My Local Database"
                                required
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>PostgreSQL Host *</label>
                                <input 
                                    type="text" 
                                    value={form.pg_host} 
                                    onChange={e => setForm({...form, pg_host: e.target.value})}
                                    placeholder="localhost"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Port *</label>
                                <input 
                                    type="number" 
                                    value={form.pg_port} 
                                    onChange={e => setForm({...form, pg_port: parseInt(e.target.value)})}
                                    placeholder="5432"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>Database Name *</label>
                            <input 
                                type="text" 
                                value={form.pg_database} 
                                onChange={e => setForm({...form, pg_database: e.target.value})}
                                placeholder="your_database"
                                required
                            />
                        </div>
                        
                        <div className="form-row">
                            <div className="form-group">
                                <label>Username *</label>
                                <input 
                                    type="text" 
                                    value={form.pg_user} 
                                    onChange={e => setForm({...form, pg_user: e.target.value})}
                                    placeholder="postgres"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Password *</label>
                                <input 
                                    type="password" 
                                    value={form.pg_password} 
                                    onChange={e => setForm({...form, pg_password: e.target.value})}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>
                        
                        <div className="form-group">
                            <label>GeoServer WMS URL *</label>
                            <input 
                                type="text" 
                                value={form.geoserver_url} 
                                onChange={e => setForm({...form, geoserver_url: e.target.value})}
                                placeholder="http://localhost:8080/geoserver/wms"
                                required
                            />
                        </div>
                        
                        <div className="form-buttons">
                            <button type="button" onClick={testConnection} disabled={testing}>
                                {testing ? 'Testing...' : '🔍 Test Connection'}
                            </button>
                            <button type="submit" disabled={saving}>
                                {saving ? 'Saving...' : (editingId ? 'Update' : 'Create')}
                            </button>
                            {editingId && (
                                <button type="button" onClick={cancelEdit}>Cancel</button>
                            )}
                        </div>
                    </form>
                </div>
                
                {message && (
                    <div className={`message ${messageType}`}>{message}</div>
                )}
                
                {/* Connections List */}
                <div className="connections-list">
                    <h3>Saved Connections</h3>
                    {loading ? (
                        <p>Loading...</p>
                    ) : connections.length === 0 ? (
                        <p className="empty-state">No connections yet. Create one above.</p>
                    ) : (
                        connections.map(conn => (
                            <div key={conn.id} className={`connection-card ${conn.is_active ? 'active' : ''}`}>
                                <div className="connection-header">
                                    <div>
                                        <strong>{conn.name}</strong>
                                        {conn.is_active && <span className="active-badge">Active</span>}
                                    </div>
                                    <div className="connection-actions">
                                        {!conn.is_active && (
                                            <button onClick={() => activateConnection(conn.id)}>Activate</button>
                                        )}
                                        <button onClick={() => editConnection(conn)}>Edit</button>
                                        <button onClick={() => deleteConnection(conn.id)} className="danger">Delete</button>
                                    </div>
                                </div>
                                <div className="connection-details">
                                    <div>📊 PostgreSQL: {conn.pg_host}:{conn.pg_port}/{conn.pg_database}</div>
                                    <div>🗺️ GeoServer: {conn.geoserver_url}</div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
            
            <style jsx>{`
                .connections-panel {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    width: 550px;
                    max-width: 90vw;
                    max-height: calc(100vh - 100px);
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
                    z-index: 1000;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                }
                
                .panel-header {
                    padding: 16px 20px;
                    background: #2196f3;
                    color: white;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .panel-header h2 {
                    margin: 0;
                    font-size: 1.2rem;
                }
                
                .close-btn {
                    background: none;
                    border: none;
                    color: white;
                    font-size: 24px;
                    cursor: pointer;
                }
                
                .panel-content {
                    padding: 20px;
                    overflow-y: auto;
                }
                
                .form-section {
                    border-bottom: 1px solid #eee;
                    padding-bottom: 20px;
                    margin-bottom: 20px;
                }
                
                .form-section h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                
                .form-group {
                    margin-bottom: 15px;
                }
                
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 500;
                    font-size: 0.85rem;
                }
                
                .form-group input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                }
                
                .form-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                }
                
                .form-buttons {
                    display: flex;
                    gap: 10px;
                    margin-top: 10px;
                }
                
                .form-buttons button {
                    padding: 8px 16px;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: 500;
                }
                
                .form-buttons button:first-child {
                    background: #607d8b;
                    color: white;
                }
                
                .form-buttons button[type="submit"] {
                    background: #4caf50;
                    color: white;
                }
                
                .message {
                    padding: 10px;
                    border-radius: 6px;
                    margin-bottom: 20px;
                }
                
                .message.success {
                    background: #d4edda;
                    color: #155724;
                    border: 1px solid #c3e6cb;
                }
                
                .message.error {
                    background: #f8d7da;
                    color: #721c24;
                    border: 1px solid #f5c6cb;
                }
                
                .connections-list h3 {
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                
                .connection-card {
                    border: 1px solid #e0e0e0;
                    border-radius: 8px;
                    padding: 12px;
                    margin-bottom: 12px;
                }
                
                .connection-card.active {
                    border-color: #4caf50;
                    background: #f1f8e9;
                }
                
                .connection-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .active-badge {
                    background: #4caf50;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.7rem;
                    margin-left: 8px;
                }
                
                .connection-actions {
                    display: flex;
                    gap: 8px;
                }
                
                .connection-actions button {
                    padding: 4px 8px;
                    font-size: 0.7rem;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                
                .connection-actions button.danger {
                    background: #f44336;
                    color: white;
                }
                
                .connection-details {
                    font-size: 0.8rem;
                    color: #666;
                }
                
                .empty-state {
                    text-align: center;
                    color: #999;
                    padding: 20px;
                }
            `}</style>
        </div>
    );
}
