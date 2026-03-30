import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function PendingEdits({ onClose }) {
  const [edits, setEdits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    const { data } = await supabase
      .from('asset_edits')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: true });
    setEdits(data || []);
    setLoading(false);
  };

  const approveEdit = async (edit) => {
    setProcessing(edit.id);
    const table = edit.feature_type === 'manhole' ? 'waste_water_manhole' : 'waste_water_pipeline';
    const updateData = edit.proposed_data;

    // Convert location from JSON to PostGIS if present
    if (updateData.location && typeof updateData.location === 'string' && updateData.location.startsWith('POINT')) {
      // keep as is; the column expects geometry
    }

    // Update main table
    const { error: updateError } = await supabase
      .from(table)
      .update(updateData)
      .eq('id', edit.feature_id);

    if (updateError) {
      alert(`Update failed: ${updateError.message}`);
      setProcessing(null);
      return;
    }

    // Mark edit as approved
    const { error: editError } = await supabase
      .from('asset_edits')
      .update({
        status: 'approved',
        reviewed_by: (await supabase.auth.getUser()).data.user.id,
        reviewed_at: new Date().toISOString()
      })
      .eq('id', edit.id);

    if (editError) {
      alert(`Error marking approved: ${editError.message}`);
    }

    fetchPending();
    setProcessing(null);
  };

  const rejectEdit = async (edit) => {
    if (!confirm('Reject this edit?')) return;
    setProcessing(edit.id);
    await supabase
      .from('asset_edits')
      .update({ status: 'rejected', reviewed_by: (await supabase.auth.getUser()).data.user.id, reviewed_at: new Date().toISOString() })
      .eq('id', edit.id);
    fetchPending();
    setProcessing(null);
  };

  const styles = {
    container: {
      position: "absolute",
      top: "80px",
      right: "20px",
      width: "500px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      overflow: "hidden",
    },
    header: { padding: "1rem", backgroundColor: "#f59e0b", color: "white", fontWeight: "bold", display: "flex", justifyContent: "space-between", alignItems: "center" },
    closeBtn: { background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" },
    content: { padding: "1rem", maxHeight: "70vh", overflowY: "auto" },
    editItem: { border: "1px solid #eee", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem", backgroundColor: "#fafafa" },
    meta: { fontSize: "0.8rem", color: "#666", marginBottom: "0.5rem" },
    data: { fontSize: "0.85rem", marginBottom: "0.5rem", background: "#f0f0f0", padding: "0.5rem", borderRadius: "4px" },
    buttons: { display: "flex", gap: "0.5rem", marginTop: "0.5rem" },
    approveBtn: { backgroundColor: "#4caf50", color: "white", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer" },
    rejectBtn: { backgroundColor: "#f44336", color: "white", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer" },
  };

  if (loading) return <div style={styles.container}><div style={styles.header}>Loading...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>📋 Pending Asset Edits</span>
        <button style={styles.closeBtn} onClick={onClose}>✕</button>
      </div>
      <div style={styles.content}>
        {edits.length === 0 ? (
          <p>No pending edits.</p>
        ) : (
          edits.map(edit => (
            <div key={edit.id} style={styles.editItem}>
              <div style={styles.meta}>
                <strong>{edit.feature_type.toUpperCase()}</strong> ID: {edit.feature_id}
                <br />Submitted: {new Date(edit.created_at).toLocaleString()}
              </div>
              <div style={styles.data}>
                <strong>Proposed changes:</strong>
                <pre>{JSON.stringify(edit.proposed_data, null, 2)}</pre>
              </div>
              <div style={styles.buttons}>
                <button style={styles.approveBtn} onClick={() => approveEdit(edit)} disabled={processing === edit.id}>Approve</button>
                <button style={styles.rejectBtn} onClick={() => rejectEdit(edit)} disabled={processing === edit.id}>Reject</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
