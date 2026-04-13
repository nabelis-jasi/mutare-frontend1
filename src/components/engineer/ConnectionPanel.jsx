import React, { useState, useEffect } from 'react';
import api from '../../api';

export default function ConnectionsPanel({ onConnectionActivated }) {
    const [connections, setConnections] = useState([]);
    const [form, setForm] = useState({
        name: '', pg_host: '', pg_port: 5432, pg_database: '', pg_user: '', pg_password: '', geoserver_url: ''
    });
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchConnections();
    }, []);

    const fetchConnections = async () => {
        const res = await api.get('/connections');
        setConnections(res.data);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            await api.put(`/connections/${editingId}`, form);
        } else {
            await api.post('/connections', form);
        }
        setForm({ name: '', pg_host: '', pg_port: 5432, pg_database: '', pg_user: '', pg_password: '', geoserver_url: '' });
        setEditingId(null);
        await fetchConnections();
    };

    const activate = async (id) => {
        await api.put(`/connections/${id}/activate`);
        await fetchConnections();
        if (onConnectionActivated) onConnectionActivated();
    };

    const deleteConn = async (id) => {
        if (confirm('Delete this connection?')) {
            await api.delete(`/connections/${id}`);
            await fetchConnections();
        }
    };

    const edit = (conn) => {
        setEditingId(conn.id);
        setForm(conn);
    };

    return (
        <div className="panel">
            <h2>Database & GeoServer Connections</h2>
            <form onSubmit={handleSubmit} style={{ marginBottom: '1rem' }}>
                <div className="form-grid">
                    <input placeholder="Connection Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                    <input placeholder="PostgreSQL Host" value={form.pg_host} onChange={e => setForm({...form, pg_host: e.target.value})} required />
                    <input placeholder="Port" type="number" value={form.pg_port} onChange={e => setForm({...form, pg_port: parseInt(e.target.value)})} required />
                    <input placeholder="Database" value={form.pg_database} onChange={e => setForm({...form, pg_database: e.target.value})} required />
                    <input placeholder="Username" value={form.pg_user} onChange={e => setForm({...form, pg_user: e.target.value})} required />
                    <input placeholder="Password" type="password" value={form.pg_password} onChange={e => setForm({...form, pg_password: e.target.value})} required />
                    <input placeholder="GeoServer URL (e.g., http://localhost:8080/geoserver/wms)" value={form.geoserver_url} onChange={e => setForm({...form, geoserver_url: e.target
