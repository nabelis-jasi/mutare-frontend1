import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'; // install

export default function FormBuilder({ form, onSaved }) {
  const [title, setTitle] = useState(form?.title || '');
  const [description, setDescription] = useState(form?.description || '');
  const [fields, setFields] = useState([]);
  const [newField, setNewField] = useState({ label: '', type: 'text', required: false, options: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (form) fetchFields();
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

  const handleSaveForm = async () => {
    setLoading(true);
    let formId = form?.id;
    if (!formId) {
      const { data, error } = await supabase
        .from('forms')
        .insert({ title, description, created_by: (await supabase.auth.getUser()).data.user.id })
        .select()
        .single();
      if (error) { console.error(error); setLoading(false); return; }
      formId = data.id;
    } else {
      await supabase.from('forms').update({ title, description }).eq('id', formId);
    }

    // Delete old fields and re-insert with order
    await supabase.from('form_fields').delete().eq('form_id', formId);
    for (let i = 0; i < fields.length; i++) {
      const f = fields[i];
      await supabase.from('form_fields').insert({
        form_id: formId,
        label: f.label,
        field_type: f.field_type,
        options: f.options ? f.options.split(',').map(s => s.trim()) : null,
        required: f.required,
        order_index: i
      });
    }
    setLoading(false);
    onSaved();
  };

  const addField = () => {
    if (!newField.label) return;
    setFields([...fields, { ...newField, id: Date.now(), options: newField.options || '' }]);
    setNewField({ label: '', type: 'text', required: false, options: '' });
  };

  const removeField = (index) => {
    const updated = [...fields];
    updated.splice(index, 1);
    setFields(updated);
  };

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(fields);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setFields(items);
  };

  return (
    <div>
      <h2>{form ? 'Edit Form' : 'Create Form'}</h2>
      <input placeholder="Form Title" value={title} onChange={e => setTitle(e.target.value)} />
      <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />

      <h3>Fields</h3>
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="fields">
          {provided => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {fields.map((field, idx) => (
                <Draggable key={field.id} draggableId={String(field.id)} index={idx}>
                  {provided => (
                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                      <strong>{field.label}</strong> ({field.field_type})
                      <button onClick={() => removeField(idx)}>Delete</button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div>
        <input placeholder="Label" value={newField.label} onChange={e => setNewField({...newField, label: e.target.value})} />
        <select value={newField.type} onChange={e => setNewField({...newField, type: e.target.value})}>
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="select">Select</option>
          <option value="checkbox">Checkbox</option>
          <option value="location">Location</option>
          <option value="photo">Photo</option>
        </select>
        {newField.type === 'select' && (
          <input placeholder="Options (comma separated)" value={newField.options} onChange={e => setNewField({...newField, options: e.target.value})} />
        )}
        <label>
          Required
          <input type="checkbox" checked={newField.required} onChange={e => setNewField({...newField, required: e.target.checked})} />
        </label>
        <button onClick={addField}>Add Field</button>
      </div>

      <button onClick={handleSaveForm} disabled={loading}>
        {loading ? 'Saving...' : 'Save Form'}
      </button>
    </div>
  );
}
