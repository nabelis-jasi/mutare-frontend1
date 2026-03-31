import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function MaintenanceRecords({ userId }) {
  // Tab state: 'assets' (list) or 'requests' (maintenance form)
  const [activeTab, setActiveTab] = useState('assets');

  // Asset list state
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

  // Fetch all assets when 'assets' tab is active
  useEffect(() => {
    if (activeTab === 'assets') {
      fetchAllAssets();
    }
  }, [activeTab]);

  const fetchAllAssets = async () => {
    setLoadingAssets(true);
    // Fetch manholes with required columns
    const { data: manholeData, error: manholeError } = await supabase
      .from('waste_water_manhole')
      .select('id, invert_level, ground_level, depth, condition_status, inspector, last_inspection_date');
    if (!manholeError) setManholes(manholeData || []);

    // Fetch pipelines (only common columns)
    const { data: pipeData, error: pipeError } = await supabase
      .from('waste_water_pipeline')
      .select('id, condition_status, inspector, last_inspection_date');
    if (!pipeError) setPipelines(pipeData || []);
    setLoadingAssets(false);
  };

  // Fetch single asset for maintenance request (when user enters an ID)
  useEffect(() => {
    if (featureId && featureId.trim() !== '') {
      fetchAsset();
    } else {
      setAsset(null);
    }
  }, [featureId, featureType]);

  // Fetch user's maintenance requests
  useEffect(() => {
    fetchMyRecords();
  }, []);

  const fetchAsset = async () => {
    setLoading(true);
    const table = featureType === 'manhole' ? 'waste_water_manhole' : 'waste_water_pipeline';
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', featureId)
      .single();
    if (error) {
      setAsset(null);
      setMessage('❌ Asset not found');
    } else {
      setAsset(data);
      setMessage('');
    }
    setLoading(false);
  };

  const fetchMyRecords = async () => {
    const { data, error } = await supabase
      .from('maintenance_records')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });
    if (!error) setRecords(data || []);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!asset) {
      setMessage('Please select a valid asset');
      return;
    }
    setSaving(true);
    const record = {
      feature_type: featureType,
      feature_id: featureId,
      ...formData,
      created_by: userId,
      status: 'pending',
      synced: false
    };
    const { error } = await supabase
      .from('maintenance_records')
      .insert([record]);
    if (error) {
      setMessage(`❌ Error: ${error.message}`);
    } else {
      setMessage('✅ Maintenance request submitted for approval.');
      setFormData({
        maintenance_type: 'inspection',
        description: '',
        priority: 'medium',
        scheduled_date: '',
        technician: '',
        notes: ''
      });
      setFeatureId('');
      setAsset(null);
      fetchMyRecords();
    }
    setSaving(false);
  };

  // Helper to get status colour and label
  const getStatusStyle = (condition) => {
    if (!condition) return { color: '#6c757d', bg: '#e9ecef', label: 'Unknown' };
    const status = condition.toLowerCase();
    if (status === 'good' || status === 'normal') {
      return { color: '#6f2da8', bg: '#e9d8fd', label: 'Normal' };  // purple
    } else if (status === 'fair' || status === 'pending') {
      return { color: '#2e7d32', bg: '#c8e6c9', label: 'Pending' }; // green
    } else if (status === 'poor' || status === 'critical' || status === 'blocked') {
      return { color: '#c62828', bg: '#ffcdd2', label: 'Blocked' };  // red
    }
    return { color: '#6c757d', bg: '#e9ecef', label: status };
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return '#dc3545';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const styles = {
    container: {
      position: "absolute",
      top: "80px",
      right: "20px",
      width: "750px",
      maxWidth: "90vw",
      maxHeight: "calc(100vh - 100px)",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
    },
    header: {
      padding: "1rem",
      backgroundColor: "#ff9800",
      color: "white",
      fontWeight: "bold",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    closeBtn: { background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" },
    tabBar: {
      display: "flex",
      borderBottom: "1px solid #e0e0e0",
      backgroundColor: "#f8f9fa",
    },
    tab: {
      flex: 1,
      padding: "0.75rem",
      textAlign: "center",
      cursor: "pointer",
      fontWeight: "bold",
      borderBottom: "2px solid transparent",
    },
    activeTab: {
      borderBottom: "2px solid #ff9800",
      color: "#ff9800",
    },
    content: { padding: "1rem", overflowY: "auto", flex: 1 },
    table: {
      width: "100%",
      borderCollapse: "collapse",
      fontSize: "0.85rem",
    },
    th: {
      textAlign: "left",
      padding: "0.5rem",
      backgroundColor: "#f0f0f0",
      borderBottom: "1px solid #ddd",
    },
    td: {
      padding: "0.5rem",
      borderBottom: "1px solid #eee",
    },
    statusBadge: {
      display: "inline-block",
      padding: "0.2rem 0.5rem",
      borderRadius: "20px",
      fontSize: "0.7rem",
      fontWeight: "bold",
    },
    row: { marginBottom: "1rem" },
    label: { display: "block", fontWeight: "bold", marginBottom: "0.25rem", color: "#555" },
    input: { width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" },
    select: { width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" },
    textarea: { width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", minHeight: "60px" },
    readonly: { backgroundColor: "#f0f0f0", padding: "0.5rem", borderRadius: "6px", color: "#666" },
    button: { padding: "0.5rem 1rem", borderRadius: "6px", border: "none", cursor: "pointer", fontWeight: "bold" },
    submitBtn: { backgroundColor: "#4caf50", color: "white", width: "100%" },
    message: { marginTop: "1rem", padding: "0.5rem", borderRadius: "4px", textAlign: "center" },
    recordItem: { border: "1px solid #eee", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem", backgroundColor: "#fafafa" },
    recordHeader: { display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" },
    recordStatus: { fontSize: "0.7rem", padding: "2px 8px", borderRadius: "12px", textTransform: "uppercase" },
    pendingBadge: { backgroundColor: "#ff9800", color: "white" },
    approvedBadge: { backgroundColor: "#4caf50", color: "white" },
    rejectedBadge: { backgroundColor: "#f44336", color: "white" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>🔧 Maintenance & Assets</span>
        <button style={styles.closeBtn} onClick={() => window.dispatchEvent(new Event('closePanel'))}>✕</button>
      </div>

      {/* Tabs */}
      <div style={styles.tabBar}>
        <div
          style={{ ...styles.tab, ...(activeTab === 'assets' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('assets')}
        >
          📋 Asset List
        </div>
        <div
          style={{ ...styles.tab, ...(activeTab === 'requests' ? styles.activeTab : {}) }}
          onClick={() => setActiveTab('requests')}
        >
          📝 Maintenance Requests
        </div>
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
                      const status = getStatusStyle(m.condition_status);
                      return (
                        <tr key={m.id}>
                          <td style={styles.td}>{m.id}</td>
                          <td style={styles.td}>{m.invert_level ?? 'N/A'}</td>
                          <td style={styles.td}>{m.ground_level ?? 'N/A'}</td>
                          <td style={styles.td}>{m.depth ?? 'N/A'}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </td>
                          <td style={styles.td}>{m.inspector || '—'}</td>
                          <td style={styles.td}>{m.last_inspection_date || '—'}</td>
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
                      const status = getStatusStyle(p.condition_status);
                      return (
                        <tr key={p.id}>
                          <td style={styles.td}>{p.id}</td>
                          <td style={styles.td}>
                            <span style={{ ...styles.statusBadge, backgroundColor: status.bg, color: status.color }}>
                              {status.label}
                            </span>
                          </td>
                          <td style={styles.td}>{p.inspector || '—'}</td>
                          <td style={styles.td}>{p.last_inspection_date || '—'}</td>
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
          <>
            {showForm && (
              <>
                <h4>Submit New Maintenance Request</h4>
                <div style={styles.row}>
                  <label style={styles.label}>Asset Type</label>
                  <select
                    style={styles.select}
                    value={featureType}
                    onChange={(e) => { setFeatureType(e.target.value); setFeatureId(''); setAsset(null); }}
                  >
                    <option value="manhole">Manhole</option>
                    <option value="pipeline">Pipeline</option>
                  </select>
                </div>

                <div style={styles.row}>
                  <label style={styles.label}>Asset ID</label>
                  <input
                    style={styles.input}
                    type="text"
                    placeholder={`Enter ${featureType} ID`}
                    value={featureId}
                    onChange={(e) => setFeatureId(e.target.value)}
                  />
                </div>

                {loading && <div>Loading asset...</div>}

                {asset && (
                  <div style={styles.row}>
                    <div style={styles.readonly}>
                      <strong>Current Asset Info (read-only)</strong><br />
                      {featureType === 'manhole' ? (
                        <>
                          📍 Location: {asset.location ? `${asset.location.coordinates[1]}, ${asset.location.coordinates[0]}` : 'N/A'}<br />
                          🔧 Condition: {asset.condition_status || 'Unknown'}<br />
                          🕒 Last Inspection: {asset.last_inspection_date || 'Never'}<br />
                          📏 Depth: {asset.depth || 'N/A'}<br />
                          🔽 Invert Level: {asset.invert_level || 'N/A'}<br />
                          🟫 Ground Level: {asset.ground_level || 'N/A'}
                        </>
                      ) : (
                        <>
                          📍 Location: {asset.location ? `${asset.location.coordinates[1]}, ${asset.location.coordinates[0]}` : 'N/A'}<br />
                          🔧 Condition: {asset.condition_status || 'Unknown'}<br />
                          🕒 Last Inspection: {asset.last_inspection_date || 'Never'}
                        </>
                      )}
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div style={styles.row}>
                    <label style={styles.label}>Maintenance Type</label>
                    <select
                      style={styles.select}
                      value={formData.maintenance_type}
                      onChange={(e) => handleChange('maintenance_type', e.target.value)}
                    >
                      <option value="inspection">Inspection</option>
                      <option value="cleaning">Cleaning</option>
                      <option value="repair">Repair</option>
                      <option value="replacement">Replacement</option>
                      <option value="emergency">Emergency</option>
                    </select>
                  </div>

                  <div style={styles.row}>
                    <label style={styles.label}>Priority</label>
                    <select
                      style={styles.select}
                      value={formData.priority}
                      onChange={(e) => handleChange('priority', e.target.value)}
                    >
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  <div style={styles.row}>
                    <label style={styles.label}>Description</label>
                    <textarea
                      style={styles.textarea}
                      placeholder="Describe the work needed"
                      value={formData.description}
                      onChange={(e) => handleChange('description', e.target.value)}
                    />
                  </div>

                  <div style={styles.row}>
                    <label style={styles.label}>Scheduled Date</label>
                    <input
                      style={styles.input}
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => handleChange('scheduled_date', e.target.value)}
                    />
                  </div>

                  <div style={styles.row}>
                    <label style={styles.label}>Technician (optional)</label>
                    <input
                      style={styles.input}
                      type="text"
                      placeholder="Assigned technician"
                      value={formData.technician}
                      onChange={(e) => handleChange('technician', e.target.value)}
                    />
                  </div>

                  <div style={styles.row}>
                    <label style={styles.label}>Notes (optional)</label>
                    <textarea
                      style={styles.textarea}
                      placeholder="Additional notes"
                      value={formData.notes}
                      onChange={(e) => handleChange('notes', e.target.value)}
                    />
                  </div>

                  <button
                    type="submit"
                    style={{ ...styles.button, ...styles.submitBtn }}
                    disabled={saving}
                  >
                    {saving ? 'Submitting...' : 'Submit Request'}
                  </button>
                </form>

                {message && (
                  <div style={{ ...styles.message, backgroundColor: message.includes('✅') ? '#d4edda' : '#f8d7da', color: message.includes('✅') ? '#155724' : '#721c24' }}>
                    {message}
                  </div>
                )}

                <hr style={{ margin: '1rem 0' }} />
              </>
            )}

            <h4>My Requests</h4>
            {records.length === 0 ? (
              <div>No maintenance requests yet.</div>
            ) : (
              records.map(record => (
                <div key={record.id} style={styles.recordItem}>
                  <div style={styles.recordHeader}>
                    <span><strong>{record.feature_type.toUpperCase()}</strong> ID: {record.feature_id}</span>
                    <span style={{
                      ...styles.recordStatus,
                      ...(record.status === 'pending' ? styles.pendingBadge : record.status === 'approved' ? styles.approvedBadge : styles.rejectedBadge)
                    }}>
                      {record.status}
                    </span>
                  </div>
                  <div><strong>{record.maintenance_type}</strong> – {record.description}</div>
                  <div>Priority: <span style={{ color: getPriorityColor(record.priority) }}>{record.priority}</span></div>
                  {record.scheduled_date && <div>📅 Scheduled: {record.scheduled_date}</div>}
                  {record.technician && <div>👤 Tech: {record.technician}</div>}
                  {record.notes && <div>📝 {record.notes}</div>}
                  <div style={{ fontSize: '0.7rem', color: '#999', marginTop: '0.5rem' }}>
                    Submitted: {new Date(record.created_at).toLocaleString()}
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>
    </div>
  );
}
