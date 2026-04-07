import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export default function SyncData({ userId }) {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState('');
  const [pendingCount, setPendingCount] = useState(0);

  // Check pending count on mount and whenever localStorage changes
  useEffect(() => {
    const updateCount = () => {
      const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');
      setPendingCount(pending.length);
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    setStatus('Syncing data...');

    try {
      // Get pending submissions from localStorage
      const pending = JSON.parse(localStorage.getItem('pending_submissions') || '[]');

      if (pending.length === 0) {
        setStatus('No pending data to sync');
        setSyncing(false);
        return;
      }

      // Get current user if userId not provided (fallback)
      let collectorId = userId;
      if (!collectorId) {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw new Error('Could not get user');
        collectorId = user.id;
      }

      let successCount = 0;
      const errors = [];

      for (const sub of pending) {
        // Prepare data for insertion
        const submissionData = {
          form_id: sub.form.id,
          collector_id: collectorId,
          data: sub.data,
          status: 'pending',
          submitted_at: new Date().toISOString()
        };

        // Add location if present
        if (sub.location && sub.location.length === 2) {
          // PostGIS expects POINT(lng lat)
          submissionData.location = `POINT(${sub.location[1]} ${sub.location[0]})`;
        }

        const { error } = await supabase
          .from('form_submissions')
          .insert([submissionData]);

        if (error) {
          errors.push({ submission: sub, error: error.message });
        } else {
          successCount++;
        }
      }

      // Update localStorage: keep only submissions that failed
      if (errors.length > 0) {
        // Save failed submissions back
        const failed = errors.map(e => e.submission);
        localStorage.setItem('pending_submissions', JSON.stringify(failed));
        setStatus(`⚠️ Synced ${successCount} of ${pending.length}. ${errors.length} failed.`);
      } else {
        localStorage.setItem('pending_submissions', '[]');
        setStatus(`✅ Synced ${successCount} items successfully!`);
      }

      setPendingCount(pending.length - successCount);

    } catch (error) {
      setStatus(`❌ Sync failed: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const styles = {
    container: {
      position: "absolute",
      top: "80px",
      right: "20px",
      width: "300px",
      backgroundColor: "white",
      borderRadius: "12px",
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      zIndex: 1000,
      overflow: "hidden",
    },
    header: {
      padding: "1rem",
      backgroundColor: "#2196f3",
      color: "white",
      fontWeight: "bold",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    content: {
      padding: "1rem",
    },
    button: {
      width: "100%",
      padding: "0.75rem",
      backgroundColor: "#2196f3",
      color: "white",
      border: "none",
      borderRadius: "6px",
      cursor: "pointer",
      fontSize: "1rem",
      transition: "background-color 0.2s",
    },
    buttonDisabled: {
      opacity: 0.7,
      cursor: "not-allowed",
    },
    status: {
      marginTop: "1rem",
      padding: "0.5rem",
      borderRadius: "4px",
      fontSize: "0.9rem",
      textAlign: "center",
    },
    badge: {
      backgroundColor: "#ff9800",
      color: "white",
      borderRadius: "20px",
      padding: "2px 8px",
      fontSize: "0.8rem",
      fontWeight: "bold",
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <span>🔄 Sync Data</span>
        {pendingCount > 0 && <span style={styles.badge}>{pendingCount} pending</span>}
      </div>
      <div style={styles.content}>
        <button
          style={{
            ...styles.button,
            ...(syncing ? styles.buttonDisabled : {}),
          }}
          onClick={handleSync}
          disabled={syncing}
          onMouseEnter={(e) => {
            if (!syncing) e.target.style.backgroundColor = "#1976d2";
          }}
          onMouseLeave={(e) => {
            if (!syncing) e.target.style.backgroundColor = "#2196f3";
          }}
        >
          {syncing ? "Syncing..." : "Sync Now"}
        </button>
        {status && (
          <div style={styles.status}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
}
