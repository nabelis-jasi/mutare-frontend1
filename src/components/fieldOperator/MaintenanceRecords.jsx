import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function MaintenanceRecords({ userId }) {
  const [activeTab, setActiveTab] = useState('assets');
  const [manholes, setManholes] = useState([]);
  const [pipelines, setPipelines] = useState([]);
  const [loadingAssets, setLoadingAssets] = useState(false);

  // Maintenance request state (unchanged)
  const [featureType, setFeatureType] = useState('manhole');
  const [featureId, setFeatureId] = useState('');
  const [asset, setAsset] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [records, setRecords] = useState([]);
  const [showForm, setShowForm] = useState(true);
  const [formData, setFormData] = useState({
    maintenance_type: 'inspection',
    description: '',
    priority: 'medium',
    scheduled_date: '',
    technician: '',
    notes: ''
  });

  useEffect(() => {
    if (activeTab === 'assets') {
      fetchAllAssets();
    }
  }, [activeTab]);

  const fetchAllAssets = async () => {
    setLoadingAssets(true);
    try {
      // Fetch all columns from waste_water_manhole
      const { data: manholeData, error: manholeError } = await supabase
        .from('waste_water_manhole')
        .select('*');
      if (!manholeError && manholeData) {
        console.log('Manhole columns:', Object.keys(manholeData[0] || {}));
        setManholes(manholeData);
      } else {
        console.error('Manhole fetch error:', manholeError);
      }

      // Fetch all columns from waste_water_pipeline
      const { data: pipeData, error: pipeError } = await supabase
        .from('waste_water_pipeline')
        .select('*');
      if (!pipeError && pipeData) {
        console.log('Pipeline columns:', Object.keys(pipeData[0] || {}));
        setPipelines(pipeData);
      } else {
        console.error('Pipeline fetch error:', pipeError);
      }
    } catch (err) {
      console.error('Fetch assets error:', err);
    }
    setLoadingAssets(false);
  };

  // Helper to safely get a field value from an object
  const getField = (obj, fieldNames, defaultValue = 'N/A') => {
    for (const name of fieldNames) {
      if (obj[name] !== undefined && obj[name] !== null) return obj[name];
    }
    return defaultValue;
  };

  const getStatusStyle = (condition) => {
    if (!condition) return { color: '#6c757d', bg: '#e9ecef', label: 'Unknown' };
    const status = String(condition).toLowerCase();
    if (status === 'good' || status === 'normal') {
      return { color: '#6f2da8', bg: '#e9d8fd', label: 'Normal' };
    } else if (status === 'fair' || status === 'pending') {
      return { color: '#2e7d32', bg: '#c8e6c9', label: 'Pending' };
    } else if (status === 'poor' || status === 'critical' || status === 'blocked') {
      return { color: '#c62828', bg: '#ffcdd2', label: 'Blocked' };
    }
    return { color: '#6c757d', bg: '#e9ecef', label: status };
  };

  // The rest of your existing functions (fetchAsset, fetchMyRecords, handleChange, handleSubmit, getPriorityColor) remain exactly as before
  // ... (copy them from your current file, unchanged) ...

  // For brevity, I'm not repeating them here, but they are identical to your previous version.
  // Make sure to keep them when you replace the file.

  const styles = { /* same as before, but adjust width if needed */ };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>🔧 Maintenance & Assets</span>
        <button style={styles.closeBtn} onClick={() => window.dispatchEvent(new Event('closePanel'))}>✕</button>
      </div>

      <div style={styles.tabBar}>
        <div style={{ ...styles.tab, ...(activeTab === 'assets' ? styles.activeTab : {}) }} onClick={() => setActiveTab('assets')}>📋 Asset List</div>
        <div style={{ ...styles.tab, ...(activeTab === 'requests' ? styles.activeTab : {}) }} onClick={() => setActiveTab('requests')}>📝 Maintenance Requests</div>
      </div>

      <div style={styles.content}>
        {activeTab === 'assets' && (
          <>
            <h4>Manholes</h4>
            {loadingAssets ? (
              <div>Loading assets...</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Invert Level</th>
                    <th style={styles.th}>Ground Level</th>
                    <th style={styles.th}>Depth</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Inspector</th>
                    <th style={styles.th}>Inspection Date</th>
                  </tr>
                </thead>
                <tbody>
                  {manholes.length === 0 ? (
                    <tr><td colSpan="7" style={{ textAlign: "center", padding: "1rem" }}>No manholes found</td></tr>
                  ) : (
                    manholes.map(m => {
                      const status = getStatusStyle(getField(m, ['condition_status', 'status']));
                      return (
                        <tr key={m.id}>
                          <td style={styles.td}>{getField(m, ['id', 'manhole_id'])}</td>
                          <td style={styles.td}>{getField(m, ['invert_level', 'inv_level', 'invert'])}</td>
                          <td style={styles.td}>{getField(m, ['ground_level', 'groundlvl', 'ground'])}</td>
                          <td style={styles.td}>{getField(m, ['depth'])}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </td>
                          <td style={styles.td}>{getField(m, ['inspector', 'inspected_by'])}</td>
                          <td style={styles.td}>{getField(m, ['last_inspection_date', 'inspection_date', 'date'])}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}

            <h4 style={{ marginTop: "1.5rem" }}>Pipelines</h4>
            {loadingAssets ? (
              <div>Loading pipelines...</div>
            ) : (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Inspector</th>
                    <th style={styles.th}>Inspection Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pipelines.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: "center", padding: "1rem" }}>No pipelines found</td></tr>
                  ) : (
                    pipelines.map(p => {
                      const status = getStatusStyle(getField(p, ['condition_status', 'status']));
                      return (
                        <tr key={p.id}>
                          <td style={styles.td}>{getField(p, ['id', 'pipeline_id'])}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </td>
                          <td style={styles.td}>{getField(p, ['inspector', 'inspected_by'])}</td>
                          <td style={styles.td}>{getField(p, ['last_inspection_date', 'inspection_date', 'date'])}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            )}
          </>
        )}

        {activeTab === 'requests' && (
          // ... your existing maintenance request JSX (unchanged) ...
          <div>Maintenance request form – keep your existing code here</div>
        )}
      </div>
    </div>
  );
}
