// src/components/fieldCollector/CollectorForm.jsx
import React, { useState, useEffect } from 'react';
import api from "../../api/api"; // adjust path

export default function CollectorForm({ userId, formId }) {
  const [formSchema, setFormSchema] = useState([]);
  const [answers, setAnswers] = useState({});
  const [location, setLocation] = useState(null);

  useEffect(() => {
    const fetchSchema = async () => {
      if (!formId) return;
      try {
        const res = await api.get(`/forms/${formId}/fields`);
        setFormSchema(res.data || []);
      } catch (err) {
        console.error('Error fetching form schema', err);
      }
    };
    fetchSchema();
  }, [formId]);

  const getGPS = () => {
    navigator.geolocation.getCurrentPosition(({ coords }) => setLocation({ lat: coords.latitude, lng: coords.longitude }));
  };

  const handleSubmit = async () => {
    if (!location) return alert('Get GPS first!');
    const payload = {
      form_id: formId,
      data: answers,
      location: { lat: location.lat, lng: location.lng }
    };
    try {
      await api.post('/submissions', payload);
      alert('Saved to backend!');
    } catch (err) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div>
      <button onClick={getGPS}>📍 Get GPS</button>
      {location && <div>Lat: {location.lat}, Lng: {location.lng}</div>}
      {formSchema.map(field => (
        <div key={field.id}>
          <label>{field.label}</label>
          {field.field_type === 'text' && (
            <input value={answers[field.id] || ''} onChange={e => setAnswers({...answers, [field.id]: e.target.value})} />
          )}
          {field.field_type === 'select' && (
            <select value={answers[field.id] || ''} onChange={e => setAnswers({...answers, [field.id]: e.target.value})}>
              <option value="">-- Select --</option>
              {field.options?.map(opt => <option key={opt}>{opt}</option>)}
            </select>
          )}
          {/* Add more field types as needed */}
        </div>
      ))}
      <button onClick={handleSubmit}>Save Submission</button>
    </div>
  );
}
