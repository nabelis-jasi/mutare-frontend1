// src/components/engineer/AnalyticsDashboard.jsx
import React, { useState, useEffect } from 'react';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import api from '../../api/api';
import CustomChartBuilder from './CustomChartBuilder'; // Import the new component

export default function AnalyticsDashboard({ onClose }) {
    // ... existing states (counts, maintenanceStats, assetEditsStats, etc.)
    const [counts, setCounts] = useState({ manholes: 0, pipelines: 0, suburbs: 0 });
    const [maintenanceStats, setMaintenanceStats] = useState([]);
    const [assetEditsStats, setAssetEditsStats] = useState([]);
    const [operatorActivity, setOperatorActivity] = useState([]);
    const [resolutionTime, setResolutionTime] = useState(null);
    const [flagHotspots, setFlagHotspots] = useState([]);
    const [maintenanceRecords, setMaintenanceRecords] = useState([]);
    const [filters, setFilters] = useState({ status: '', feature_type: '', start_date: '', end_date: '' });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'joblogs', 'reports', 'custom'

    // Job logs states (unchanged)
    const [jobLogs, setJobLogs] = useState([]);
    const [jobLogFilters, setJobLogFilters] = useState({ start_date: '', end_date: '', operator_id: '', action_type: '' });
    const [operators, setOperators] = useState([]);
    const [actionTypes, setActionTypes] = useState([]);

    // Periodic reports states
    const [dailyReports, setDailyReports] = useState([]);
    const [weeklyReports, setWeeklyReports] = useState([]);
    const [monthlyReports, setMonthlyReports] = useState([]);
    const [reportPeriod, setReportPeriod] = useState('daily');

    // Data for custom chart builder (all maintenance records or any dataset)
    const [chartData, setChartData] = useState([]);
    const [chartFields, setChartFields] = useState([]);

    useEffect(() => {
        fetchAllData();
        fetchJobLogs();
        fetchPeriodicReports();
        fetchOperatorsAndActions();
        fetchChartData(); // Fetch data for custom charts
    }, []);

    const fetchAllData = async () => { /* unchanged */ };
    const fetchJobLogs = async () => { /* unchanged */ };
    const fetchPeriodicReports = async () => { /* unchanged */ };
    const fetchOperatorsAndActions = async () => { /* unchanged */ };

    // New: fetch data for custom charts (e.g., all maintenance records with date and counts)
    const fetchChartData = async () => {
        try {
            const res = await api.get('/analytics/maintenance-records', { params: { limit: 500 } });
            // Transform data for charting: extract numeric fields and dates
            const data = res.data.map(rec => ({
                date: new Date(rec.created_at).toLocaleDateString(),
                maintenance_type: rec.maintenance_type,
                priority: rec.priority,
                status: rec.status
            }));
            setChartData(data);
            // Extract unique field names from first record for dropdowns
            if (data.length > 0) {
                setChartFields(Object.keys(data[0]));
            }
        } catch (err) {
            console.error('Error fetching chart data', err);
        }
    };

    // Deduplicate periodic reports by aggregating counts for same period
    const deduplicateReports = (reports) => {
        const map = new Map();
        reports.forEach(r => {
            const key = r.period;
            if (map.has(key)) {
                const existing = map.get(key);
                existing.maintenance_count += r.maintenance_count || 0;
                existing.asset_edits_count += r.asset_edits_count || 0;
                existing.flags_count += r.flags_count || 0;
            } else {
                map.set(key, { ...r });
            }
        });
        return Array.from(map.values());
    };

    // Apply deduplication before rendering
    const getUniqueReportData = () => {
        let raw;
        switch (reportPeriod) {
            case 'daily': raw = dailyReports; break;
            case 'weekly': raw = weeklyReports; break;
            case 'monthly': raw = monthlyReports; break;
            default: raw = dailyReports;
        }
        return deduplicateReports(raw);
    };

    // ... applyFilters, handleFilterChange, etc. (unchanged)
    const applyFilters = () => fetchAllData();
    const applyJobLogFilters = () => fetchJobLogs();
    const handleFilterChange = (e) => setFilters({ ...filters, [e.target.name]: e.target.value });
    const handleJobLogFilterChange = (e) => setJobLogFilters({ ...jobLogFilters, [e.target.name]: e.target.value });

    // Styles (unchanged)
    const styles = { /* same as before */ };
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (loading) return <div style={styles.container}><div style={styles.header}><span>Analytics Dashboard</span><button style={styles.closeBtn} onClick={onClose}>×</button></div><div style={styles.content}>Loading analytics...</div></div>;

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <span>📊 Analytics Dashboard</span>
                <button style={styles.closeBtn} onClick={onClose}>×</button>
            </div>
            <div style={styles.content}>
                {/* Tab Bar - added "Custom Charts" */}
                <div style={styles.tabBar}>
                    <button style={{ ...styles.tab, ...(activeTab === 'overview' ? styles.activeTab : {}) }} onClick={() => setActiveTab('overview')}>Overview</button>
                    <button style={{ ...styles.tab, ...(activeTab === 'joblogs' ? styles.activeTab : {}) }} onClick={() => setActiveTab('joblogs')}>Job Logs</button>
                    <button style={{ ...styles.tab, ...(activeTab === 'reports' ? styles.activeTab : {}) }} onClick={() => setActiveTab('reports')}>Periodic Reports</button>
                    <button style={{ ...styles.tab, ...(activeTab === 'custom' ? styles.activeTab : {}) }} onClick={() => setActiveTab('custom')}>Custom Charts</button>
                </div>

                {/* Overview Tab (unchanged) */}
                {activeTab === 'overview' && ( /* same JSX as before */ )}

                {/* Job Logs Tab (unchanged) */}
                {activeTab === 'joblogs' && ( /* same JSX as before */ )}

                {/* Periodic Reports Tab - with deduplicated data */}
                {activeTab === 'reports' && (
                    <div>
                        <h3>Periodic Reports</h3>
                        <div style={styles.filterBar}>
                            <button style={{ ...styles.tab, ...(reportPeriod === 'daily' ? styles.activeTab : {}) }} onClick={() => setReportPeriod('daily')}>Daily</button>
                            <button style={{ ...styles.tab, ...(reportPeriod === 'weekly' ? styles.activeTab : {}) }} onClick={() => setReportPeriod('weekly')}>Weekly</button>
                            <button style={{ ...styles.tab, ...(reportPeriod === 'monthly' ? styles.activeTab : {}) }} onClick={() => setReportPeriod('monthly')}>Monthly</button>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th style={styles.tableHeader}>Period</th>
                                        <th style={styles.tableHeader}>Maintenance Requests</th>
                                        <th style={styles.tableHeader}>Asset Edits</th>
                                        <th style={styles.tableHeader}>Flags Reported</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {getUniqueReportData().map(row => (
                                        <tr key={row.period}>
                                            <td style={styles.tableCell}>{row.period}</td>
                                            <td style={styles.tableCell}>{row.maintenance_count || 0}</td>
                                            <td style={styles.tableCell}>{row.asset_edits_count || 0}</td>
                                            <td style={styles.tableCell}>{row.flags_count || 0}</td>
                                        </tr>
                                    ))}
                                    {getUniqueReportData().length === 0 && <tr><td colSpan="4" style={styles.tableCell}>No data available</td>}</tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Custom Charts Tab */}
                {activeTab === 'custom' && (
                    <div>
                        <h3>Build Your Own Chart</h3>
                        <CustomChartBuilder
                            data={chartData}
                            availableFields={chartFields}
                            onExport={(chartData) => console.log('Export chart', chartData)} // optional
                        />
                    </div>
                )}
            </div>
        </div>
    );
}
