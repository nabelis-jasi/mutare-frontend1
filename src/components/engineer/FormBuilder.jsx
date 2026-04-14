import React, { useState, useEffect } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { SortableItem } from './SortableItem'; // we'll create this
import api from '../../api/api';

const FIELD_TYPES = [
    { id: 'text', label: 'Text', icon: '📝' },
    { id: 'number', label: 'Number', icon: '🔢' },
    { id: 'select', label: 'Select', icon: '📋' },
    { id: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { id: 'radio', label: 'Radio', icon: '🔘' },
    { id: 'textarea', label: 'Textarea', icon: '✏️' },
    { id: 'date', label: 'Date', icon: '📅' },
    { id: 'location', label: 'Location', icon: '📍' },
    { id: 'photo', label: 'Photo', icon: '📷' },
];

export default function FormBuilder({ formId, onSaved, onCancel }) {
    const [schema, setSchema] = useState({ fields: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedField, setSelectedField] = useState(null);
    const [newFieldType, setNewFieldType] = useState('text');

    useEffect(() => {
        if (formId) fetchSchema();
        else setSchema({ fields: [] });
    }, [formId]);

    const fetchSchema = async () => {
        const res = await api.get(`/forms/${formId}/schema`);
        setSchema(res.data);
        setLoading(false);
    };

    const saveSchema = async () => {
        setSaving(true);
        await api.put(`/forms/${formId}/schema`, { schema });
        if (onSaved) onSaved();
        setSaving(false);
    };

    const addField = () => {
        const newField = {
            id: `field_${Date.now()}`,
            type: newFieldType,
            label: `New ${FIELD_TYPES.find(f => f.id === newFieldType)?.label} field`,
            required: false,
            options: newFieldType === 'select' || newFieldType === 'radio' ? ['Option 1'] : undefined,
        };
        setSchema(prev => ({ ...prev, fields: [...prev.fields, newField] }));
        setSelectedField(newField.id);
    };

    const removeField = (id) => {
        setSchema(prev => ({ ...prev, fields: prev.fields.filter(f => f.id !== id) }));
        if (selectedField === id) setSelectedField(null);
    };

    const updateField = (id, updates) => {
        setSchema(prev => ({
            ...prev,
            fields: prev.fields.map(f => f.id === id ? { ...f, ...updates } : f)
        }));
    };

    const onDragEnd = (event) => {
        const { active, over } = event;
        if (active.id !== over.id) {
            const oldIndex = schema.fields.findIndex(f => f.id === active.id);
            const newIndex = schema.fields.findIndex(f => f.id === over.id);
            setSchema(prev => ({
                ...prev,
                fields: arrayMove(prev.fields, oldIndex, newIndex)
            }));
        }
    };

    const sensors = useSensors(useSensor(PointerSensor));

    if (loading) return <div className="p-4">Loading form builder...</div>;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg w-11/12 max-w-6xl h-5/6 flex flex-col shadow-xl">
                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h2 className="text-xl font-bold">Form Builder</h2>
                    <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">✕</button>
                </div>

                <div className="flex flex-1 overflow-hidden">
                    {/* Left: Field list (draggable) */}
                    <div className="w-1/3 border-r p-4 overflow-y-auto">
                        <h3 className="font-semibold mb-2">Field Types</h3>
                        <div className="space-y-2 mb-4">
                            {FIELD_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    onClick={() => setNewFieldType(type.id)}
                                    className={`w-full text-left px-3 py-2 rounded flex items-center gap-2 ${newFieldType === type.id ? 'bg-blue-100 border-blue-500' : 'bg-gray-50 hover:bg-gray-100'}`}
                                >
                                    <span>{type.icon}</span> {type.label}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={addField}
                            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                        >
                            + Add Field
                        </button>
                    </div>

                    {/* Center: Form fields (sortable) */}
                    <div className="w-1/2 border-r p-4 overflow-y-auto">
                        <h3 className="font-semibold mb-2">Form Fields</h3>
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                            <SortableContext items={schema.fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {schema.fields.map(field => (
                                        <SortableItem key={field.id} id={field.id}>
                                            <div
                                                className={`border rounded p-3 cursor-move hover:shadow-md transition ${selectedField === field.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                                                onClick={() => setSelectedField(field.id)}
                                            >
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400">⋮⋮</span>
                                                        <span className="font-medium">{field.label}</span>
                                                        <span className="text-xs text-gray-500">({FIELD_TYPES.find(t => t.id === field.type)?.label})</span>
                                                        {field.required && <span className="text-red-500 text-xs">*</span>}
                                                    </div>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); removeField(field.id); }}
                                                        className="text-red-500 hover:text-red-700"
                                                    >🗑️</button>
                                                </div>
                                            </div>
                                        </SortableItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                        {schema.fields.length === 0 && <div className="text-gray-400 text-center py-8">No fields yet. Add some from the left panel.</div>}
                    </div>

                    {/* Right: Field properties */}
                    <div className="w-1/3 p-4 overflow-y-auto">
                        <h3 className="font-semibold mb-2">Properties</h3>
                        {selectedField ? (
                            <>
                                {(() => {
                                    const field = schema.fields.find(f => f.id === selectedField);
                                    if (!field) return null;
                                    return (
                                        <div className="space-y-3">
                                            <div>
                                                <label className="block text-sm font-medium">Label</label>
                                                <input
                                                    type="text"
                                                    value={field.label}
                                                    onChange={e => updateField(field.id, { label: e.target.value })}
                                                    className="w-full border rounded px-2 py-1"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium">Required</label>
                                                <input
                                                    type="checkbox"
                                                    checked={field.required}
                                                    onChange={e => updateField(field.id, { required: e.target.checked })}
                                                />
                                            </div>
                                            {(field.type === 'select' || field.type === 'radio') && (
                                                <div>
                                                    <label className="block text-sm font-medium">Options</label>
                                                    {field.options?.map((opt, idx) => (
                                                        <div key={idx} className="flex gap-1 mb-1">
                                                            <input
                                                                type="text"
                                                                value={opt}
                                                                onChange={e => {
                                                                    const newOpts = [...field.options];
                                                                    newOpts[idx] = e.target.value;
                                                                    updateField(field.id, { options: newOpts });
                                                                }}
                                                                className="flex-1 border rounded px-2 py-1"
                                                            />
                                                            <button
                                                                onClick={() => {
                                                                    const newOpts = field.options.filter((_, i) => i !== idx);
                                                                    updateField(field.id, { options: newOpts });
                                                                }}
                                                                className="text-red-500"
                                                            >✕</button>
                                                        </div>
                                                    ))}
                                                    <button
                                                        onClick={() => updateField(field.id, { options: [...(field.options || []), 'New Option'] })}
                                                        className="text-blue-600 text-sm"
                                                    >+ Add option</button>
                                                </div>
                                            )}
                                            {field.type === 'location' && (
                                                <div className="text-sm text-gray-500">Location picker will be added on map.</div>
                                            )}
                                            {field.type === 'photo' && (
                                                <div className="text-sm text-gray-500">Photo capture will be integrated.</div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </>
                        ) : (
                            <div className="text-gray-400 text-center py-8">Select a field to edit its properties</div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-4 flex justify-end gap-2">
                    <button onClick={onCancel} className="px-4 py-2 border rounded hover:bg-gray-100">Cancel</button>
                    <button onClick={saveSchema} disabled={saving} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                        {saving ? 'Saving...' : 'Save Form'}
                    </button>
                </div>
            </div>
        </div>
    );
}
