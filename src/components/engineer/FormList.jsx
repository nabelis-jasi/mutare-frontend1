import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function FormList({ onSelectForm, onClose, onCreateNew }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, description, is_active')
        .order('created_at', { ascending: false });
      if (!error) setForms(data || []);
      setLoading(false);
    };
    fetchForms();
  }, []);

  const styles = {
    container: {
      position: "absolute",
      top: "80px",
      right: "20px",
      width: "350px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      overflow: "hidden",
    },
    header: {
      padding: "1rem",
      backgroundColor: "#8fdc00",
      color: "white",
      fontWeight: "bold",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    content: {
      padding: "1rem",
      maxHeight: "400px",
      overflowY: "auto",
    },
    formItem: {
      padding: "0.75rem",
      marginBottom: "0.5rem",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
      cursor: "pointer",
      transition: "background-color 0.2s",
    },
    formTitle: { fontWeight: "bold", marginBottom: "0.25rem" },
    formDesc: { fontSize: "0.8rem", color: "#666" },
    closeBtn: { background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" },
    newBtn: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#4caf50",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      marginTop: "1rem",
      fontWeight: "bold",
    },
    emptyMsg: { textAlign: "center", color: "#666", padding: "1rem" },
  };

  if (loading) return <div style={styles.container}><div style={styles.header}>Loading forms...</div></div>;

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>📝 Forms</span>
        {onClose && <button style={styles.closeBtn} onClick={onClose}>✕</button>}
      </div>
      <div style={styles.content}>
        {forms.length === 0 ? (
          <div style={styles.emptyMsg}>No forms yet. Click below to create one.</div>
        ) : (
          forms.map(form => (
            <div
              key={form.id}
              style={styles.formItem}
              onClick={() => onSelectForm(form)}
              onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e0e0e0"}
              onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f9f9f9"}
            >
              <div style={styles.formTitle}>
                {form.title} {!form.is_active && <span style={{ color: "#f44336" }}>(inactive)</span>}
              </div>
              {form.description && <div style={styles.formDesc}>{form.description}</div>}
            </div>
          ))
        )}
        <button style={styles.newBtn} onClick={onCreateNew}>+ New Form</button>
      </div>
    </div>
  );
}
