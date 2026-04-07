import React, { useState, useRef, useEffect } from 'react';
import api from "../../api/api";
import L from 'leaflet';

// ... Haversine and helper functions remain the same ...

export default function DataCollection({ userId, map, onDataCollected, onClose, onStartMapPick, onCancelMapPick }) {
  // ... same state declarations ...

  // Fetch engineer-defined questions from backend
  useEffect(() => {
    const fetchSchema = async () => {
      if (!mode) return;
      try {
        const res = await api.get('/collector-schema', { params: { mode } });
        const data = res.data;
        if (data && data.length) {
          setDynamicForm(data);
          const initialAnswers = {};
          data.forEach(q => { initialAnswers[q.id] = ''; });
          setAnswers(initialAnswers);
        }
      } catch (err) {
        console.error('Error fetching schema:', err);
      }
    };
    fetchSchema();
  }, [mode]);

  // ... other functions unchanged except save ...

  const save = async () => {
    setSaving(true);
    setStatus('');
    try {
      if ((mode === 'manhole' && points.length < 1) || (mode === 'pipeline' && points.length < 2)) {
        throw new Error('Not enough points set on map.');
      }

      const payload = {
        user_id: userId,
        mode,
        geom: mode === 'manhole'
          ? { type: 'Point', coordinates: [points[0].lng, points[0].lat] }
          : { type: 'LineString', coordinates: points.map(p => [p.lng, p.lat]) },
        answers,
        created_at: new Date().toISOString(),
      };

      await api.post('/collector-submissions', payload);

      setSaved(true);
      setStatus('✓ Saved successfully!');
      setStCls('ok');
      clearMapLayers();
      setTimeout(() => { onDataCollected(); reset(); }, 1500);

    } catch (err) {
      setStatus(err.response?.data?.error || err.message);
      setStCls('err');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // ... JSX unchanged ...

}
