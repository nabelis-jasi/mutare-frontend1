import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../api';
import MapView from '../MapView';

export default function OverviewPanel({ geoserverUrl }) {
    const [counts, setCounts] = useState({ manholes: 0, pipelines: 0, suburbs: 0 });
    const [maintenanceStats, setMaintenanceStats] = useState([]);
    const [assetEditsStats, setAssetEditsStats] = useState([]);
    const [operatorActivity, setOperatorActivity] = useState([]);
    const [resolutionTime, setResolutionTime] = useState(null);
    const [flagHotspots, setFlagHotspots] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [countsRes, maintRes, editsRes, activityRes, timeRes, hotspotsRes] = await Promise.all([
            api.get('/analytics/counts'),
            api.get('/analytics/maintenance-stats'),
            api.get('/analytics/asset-edits-stats'),
            api.get('/analytics/operator-activity'),
            api.get('/analytics/resolution-time'),
            api.get('/analytics/flag-hotspots')
        ]);
        setCounts(countsRes.data);
        setMaintenanceStats(maintRes.data);
        setAssetEditsStats(editsRes.data);
        setOperatorActivity(activityRes.data);
        setResolutionTime(timeRes.data.avg_hours);
        setFlagHotspots(hotspotsRes.data);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    return (
        <div style={{ padding: '1rem' }}>
            <h2>Overview</h2>
            {/* KPI Cards */}
            <div className="kpi-grid">
                <div className="kpi-card"><h3>Manholes</h3><p>{counts.manholes}</p></div>
                <div className="kpi-card"><h3>Pipelines</h3><p>{counts.pipelines}</p></div>
                <div className="kpi-card"><h3>Suburbs</h3><p>{counts.suburbs}</p></div>
                <div className="kpi-card"><h3>Avg Resolution Time</h3><p>{resolutionTime} hours</p></div>
            </div>

            {/* Charts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h3>Maintenance Requests by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={maintenanceStats} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label>
                                {maintenanceStats.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div>
                    <h3>Asset Edits by Status</h3>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={assetEditsStats} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80} label />
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>Operator Activity (Last 30 Days)</h3>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={operatorActivity}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="count" stroke="#8884d8" />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>Flag Hotspots</h3>
                <table className="data-table">
                    <thead>
                        <tr><th>Suburb</th><th>Feature ID</th><th>Flag Count</th></tr>
                    </thead>
                    <tbody>
                        {flagHotspots.map(h => (
                            <tr key={h.feature_id}><td>{h.suburb}</td><td>{h.feature_id}</td><td>{h.flag_count}</td></tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div style={{ marginBottom: '2rem' }}>
                <h3>Map View (GeoServer)</h3>
                {geoserverUrl && <MapView geoserverUrl={geoserverUrl} />}
            </div>
        </div>
    );
}
