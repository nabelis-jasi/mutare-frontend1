// src/components/engineer/CellEdit.jsx
import React from 'react';
import PropTypes from 'prop-types';

export default function CellEdit({ feature, onEdit }) {
  const handleEdit = () => {
    if (onEdit) {
      onEdit(feature);
    }
  };

  // You can implement permission checks here if needed
  // For now, allow editing for all features
  const canEdit = true;

  return (
    <button
      className="cell-edit-btn"
      onClick={handleEdit}
      disabled={!canEdit}
      title="Edit feature"
      style={{
        background: 'none',
        border: 'none',
        cursor: canEdit ? 'pointer' : 'not-allowed',
        fontSize: '1.2rem',
        padding: '0.25rem'
      }}
    >
      ✏️
    </button>
  );
}

CellEdit.propTypes = {
  feature: PropTypes.object.isRequired,
  onEdit: PropTypes.func.isRequired,
};
