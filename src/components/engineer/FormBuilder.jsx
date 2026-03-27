import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

export default function FormBuilder({ form, onSaved, onCancel }) {
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ label: '', type: 'text', required: false, options: '' });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Only fetch fields if editing an existing form (has an id)
  useEffect(() => {
    if (form?.id) {
      fetchFields();
    } else {
      setFields([]);
    }
  }, [form]);

  const fetchFields = async () => {
    const { data } = await supabase
      .from('form_fields')
      .select('*')
      .eq('form_id', form.id)
      .order('order_index');
    setFields(data || []);
  };

  const addField = () => {
    if (!newField.label.trim()) return;
    setFields([...fields, { ...newField, id: Date.now(), options: newField.options || '' }]);
    setNewField({ label: '', type: 'text', required: false, options: '' });
  };

  const removeField = (index) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  const saveForm = async () => {
    setSaving(true);
    let formId = form?.id;

    try {
      // 1. Save/update the form
      if (!formId) {
        const { data, error } = await supabase
          .from('forms')
          .insert({
            title,
            description,
            created_by: (await supabase.auth.getUser()).data.user.id,
            is_active: true,
          })
          .select()
          .single();
        if (error) throw error;
        formId = data.id;
      } else {
        const { error } = await supabase
          .from('forms')
          .update({ title, description })
          .eq('id', formId);
        if (error) throw error;
      }

      // 2. Replace all fields
      await supabase.from('form_fields').delete().eq('form_id', formId);
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        await supabase.from('form_fields').insert({
          form_id: formId,
          label: f.label,
          field_type: f.field_type,
          options: f.options ? f.options.split(',').map(s => s.trim()) : null,
          required: f.required,
          order_index: i,
        });
      }

      if (onSaved) onSaved();
    } catch (err) {
      alert('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Panel styles (matching your other panels)
  const styles = {
    container: {
      position: "absolute",
      top: "80px",
      right: "20px",
      width: "450px",
      maxWidth: "90vw",
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
      maxHeight: "70vh",
      overflowY: "auto",
    },
    input: {
      width: "100%",
      padding: "0.5rem",
      marginBottom: "0.5rem",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    textarea: {
      width: "100%",
      padding: "0.5rem",
      marginBottom: "1rem",
      border: "1px solid #ccc",
      borderRadius: "4px",
    },
    fieldRow: {
      padding: "0.5rem",
      marginBottom: "0.5rem",
      backgroundColor: "#f5f5f5",
      borderRadius: "6px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    addFieldSection: {
      marginTop: "1rem",
      paddingTop: "1rem",
      borderTop: "1px solid #eee",
    },
    button: {
      padding: "0.5rem 1rem",
      marginRight: "0.5rem",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
      fontWeight: "bold",
    },
    saveBtn: { backgroundColor: "#4caf50", color: "white" },
    cancelBtn: { backgroundColor: "#f44336", color: "white" },
    closeBtn: { background: "none", border: "none", color: "white", fontSize: "1.2rem", cursor: "pointer" },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>{form?.id ? 'Edit Form' : 'Create New Form'}</span>
        {onCancel && (
          <button style={styles.closeBtn} onClick={onCancel}>✕</button>
        )}
      </div>
      <div style={styles.content}>
        <input
          type="text"
          placeholder="Form Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          style={styles.input}
        />
        <textarea
          placeholder="Description (optional)"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={styles.textarea}
          rows={2}
        />

        <h4>Fields</h4>
        {fields.length === 0 && (
          <p style={{ color: "#666", fontSize: "0.9rem" }}>No fields yet. Add one below.</p>
        )}
        {fields.map((field, idx) => (
          <div key={field.id} style={styles.fieldRow}>
            <span>
              <strong>{field.label}</strong> ({field.field_type})
              {field.required && ' *'}
            </span>
            <button
              onClick={() => removeField(idx)}
              style={{ ...styles.button, backgroundColor: "#f44336", color: "white", padding: "2px 8px" }}
            >
              Delete
            </button>
          </div>
        ))}

        <div style={styles.addFieldSection}>
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
            <input
              type="text"
              placeholder="Field label"
              value={newField.label}
              onChange={e => setNewField({ ...newField, label: e.target.value })}
              style={{ flex: 2, padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            />
            <select
              value={newField.type}
              onChange={e => setNewField({ ...newField, type: e.target.value })}
              style={{ padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            >
              <option value="text">Text</option>
              <option value="number">Number</option>
              <option value="select">Select</option>
              <option value="checkbox">Checkbox</option>
              <option value="location">Location</option>
              <option value="photo">Photo</option>
            </select>
          </div>
          <div style={{ marginBottom: "0.5rem" }}>
            <label>
              <input
                type="checkbox"
                checked={newField.required}
                onChange={e => setNewField({ ...newField, required: e.target.checked })}
              /> Required
            </label>
          </div>
          {newField.type === 'select' && (
            <input
              type="text"
              placeholder="Options (comma separated)"
              value={newField.options}
              onChange={e => setNewField({ ...newField, options: e.target.value })}
              style={{ width: "100%", padding: "0.5rem", marginBottom: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
            />
          )}
          <button
            onClick={addField}
            style={{ ...styles.button, backgroundColor: "#2196f3", color: "white" }}
          >
            Add Field
          </button>
        </div>

        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button
            onClick={saveForm}
            style={{ ...styles.button, ...styles.saveBtn }}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Form'}
          </button>
          {onCancel && (
            <button onClick={onCancel} style={{ ...styles.button, ...styles.cancelBtn }}>
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
