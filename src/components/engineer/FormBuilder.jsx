import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';

const FIELD_TYPES = [
  { id: 'text',     icon: '🔤', label: 'Text'     },
  { id: 'number',   icon: '🔢', label: 'Number'   },
  { id: 'select',   icon: '📋', label: 'Select'   },
  { id: 'checkbox', icon: '☑️', label: 'Checkbox' },
  { id: 'location', icon: '📍', label: 'Location' },
  { id: 'photo',    icon: '📷', label: 'Photo'    },
  { id: 'textarea', icon: '📝', label: 'Textarea' },
];

const BLANK_FIELD = { label: '', field_type: 'text', required: false, options: '' };

export default function FormBuilder({ form, onSaved, onCancel }) {
  const isNew = !form?.id;

  const [title,       setTitle]       = useState(form?.title       || '');
  const [description, setDesc]        = useState(form?.description || '');
  const [fields,      setFields]      = useState([]);
  const [newField,    setNewField]    = useState({ ...BLANK_FIELD });
  const [saving,      setSaving]      = useState(false);
  const [saved,       setSaved]       = useState(false);
  const [error,       setError]       = useState('');

  useEffect(() => {
    if (form?.id) fetchFields();
    else setFields([]);
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
    if (!newField.label.trim()) { setError('Field label is required.'); return; }
    setError('');
    setFields(prev => [...prev, { ...newField, id: `new_${Date.now()}` }]);
    setNewField({ ...BLANK_FIELD });
  };

  const removeField = (i) => setFields(prev => prev.filter((_, idx) => idx !== i));

  const moveField = (i, dir) => {
    const updated = [...fields];
    const j = i + dir;
    if (j < 0 || j >= updated.length) return;
    [updated[i], updated[j]] = [updated[j], updated[i]];
    setFields(updated);
  };

  const saveForm = async () => {
    if (!title.trim()) { setError('Form title is required.'); return; }
    if (fields.length === 0) { setError('Add at least one field.'); return; }
    setError('');
    setSaving(true);
    let formId = form?.id;

    try {
      if (isNew) {
        const { data: { user } } = await supabase.auth.getUser();
        const { data, error: e } = await supabase
          .from('forms')
          .insert({ title, description, created_by: user.id, is_active: true })
          .select()
          .single();
        if (e) throw e;
        formId = data.id;
      } else {
        const { error: e } = await supabase
          .from('forms')
          .update({ title, description })
          .eq('id', formId);
        if (e) throw e;
      }

      // Replace all fields
      await supabase.from('form_fields').delete().eq('form_id', formId);
      for (let i = 0; i < fields.length; i++) {
        const f = fields[i];
        const { error: fe } = await supabase.from('form_fields').insert({
          form_id:     formId,
          label:       f.label,
          field_type:  f.field_type,
          options:     f.options ? f.options.split(',').map(s => s.trim()).filter(Boolean) : null,
          required:    f.required,
          order_index: i,
        });
        if (fe) throw fe;
      }

      setSaved(true);
      setTimeout(() => { onSaved?.(); }, 900);
    } catch (err) {
      setError('Save failed: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const selectedType = FIELD_TYPES.find(t => t.id === newField.field_type);

  return (
    <div className="wd-panel" style={{ '--panel-icon-bg': 'rgba(143,220,0,0.1)', '--panel-icon-border': 'rgba(143,220,0,0.3)' }}>
      <div className="wd-panel-header">
        <div className="wd-panel-icon">📝</div>
        <div>
          <div className="wd-panel-title">{isNew ? 'New Form' : 'Edit Form'}</div>
          <div className="wd-panel-sub">{fields.length} field{fields.length !== 1 ? 's' : ''} · {isNew ? 'Draft' : 'Editing'}</div>
        </div>
        <button className="wd-panel-close" onClick={onCancel}>×</button>
      </div>

      <div className="wd-panel-body">
        {/* Form metadata */}
        <div className="wd-section">Form Details</div>

        <div className="wd-field" style={{ marginBottom: 10 }}>
          <label className="wd-label">Title *</label>
          <input className="wd-input" placeholder="e.g. Manhole Inspection Form" value={title}
            onChange={e => setTitle(e.target.value)} />
        </div>

        <div className="wd-field" style={{ marginBottom: 16 }}>
          <label className="wd-label">Description (optional)</label>
          <textarea className="wd-textarea" rows={2}
            placeholder="Describe what this form is used for…"
            value={description} onChange={e => setDesc(e.target.value)} />
        </div>

        {/* Fields list */}
        <div className="wd-section">
          Fields
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>
            {fields.length} added
          </span>
        </div>

        {fields.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '16px 0', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
            No fields yet — add one below
          </div>
        ) : (
          fields.map((f, i) => (
            <div key={f.id} className="wd-fb-field-row">
              <span className="fr-drag">⠿</span>
              <div className="fr-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span className="fr-label">{f.label}</span>
                  {f.required && <span className="fr-req">Required</span>}
                </div>
                <div className="fr-type">
                  {FIELD_TYPES.find(t => t.id === f.field_type)?.icon} {f.field_type}
                  {f.options && ` · ${f.options}`}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <button onClick={() => moveField(i, -1)} disabled={i === 0}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, padding: '0 2px' }}>↑</button>
                <button onClick={() => moveField(i, 1)} disabled={i === fields.length - 1}
                  style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', fontSize: 12, padding: '0 2px' }}>↓</button>
                <button className="fr-del" onClick={() => removeField(i)}>×</button>
              </div>
            </div>
          ))
        )}

        {/* Add field */}
        <div className="wd-section" style={{ marginTop: 18 }}>Add Field</div>

        {/* Field type chips */}
        <div className="wd-fb-type-chips">
          {FIELD_TYPES.map(t => (
            <div key={t.id}
              className={`wd-fb-type-chip${newField.field_type === t.id ? ' active' : ''}`}
              onClick={() => setNewField(f => ({ ...f, field_type: t.id }))}
            >
              {t.icon} {t.label}
            </div>
          ))}
        </div>

        <div className="wd-fb-add-row">
          <input
            className="wd-input"
            placeholder={`${selectedType?.label || 'Text'} field label…`}
            value={newField.label}
            onChange={e => setNewField(f => ({ ...f, label: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addField()}
          />
        </div>

        {newField.field_type === 'select' && (
          <div className="wd-field" style={{ marginBottom: 8 }}>
            <label className="wd-label">Options (comma separated)</label>
            <input className="wd-input" placeholder="e.g. Good, Fair, Poor, Blocked"
              value={newField.options} onChange={e => setNewField(f => ({ ...f, options: e.target.value }))} />
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label className="wd-fb-check-row">
            <input type="checkbox" checked={newField.required}
              onChange={e => setNewField(f => ({ ...f, required: e.target.checked }))} />
            <span className="wd-fb-check-label">Required field</span>
          </label>
          <button className="wd-btn wd-btn-ghost" style={{ padding: '6px 14px', fontSize: 11 }} onClick={addField}>
            + Add Field
          </button>
        </div>

        {error && <div className="wd-status err">{error}</div>}
        {saved && <div className="wd-status ok">✓ Form saved successfully</div>}

        <div className="wd-btn-row" style={{ marginTop: 16 }}>
          <button className="wd-btn wd-btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="wd-btn wd-btn-lime" onClick={saveForm} disabled={saving || saved}>
            {saving ? '⏳ Saving…' : saved ? '✓ Saved' : isNew ? '💾 Create Form' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}