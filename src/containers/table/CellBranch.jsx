// src/components/engineer/CellBranch.jsx (simplified)
import React from 'react';
import PropTypes from 'prop-types';

export default function CellBranch({ count, onView, onAdd, canAdd = true }) {
  return (
    <div className="cell-branch">
      <button className="branch-count" onClick={onView}>
        {count}
      </button>
      {canAdd && (
        <button className="branch-add" onClick={onAdd}>
          +
        </button>
      )}
    </div>
  );
}

CellBranch.propTypes = {
  count: PropTypes.number.isRequired,
  onView: PropTypes.func.isRequired,
  onAdd: PropTypes.func.isRequired,
  canAdd: PropTypes.bool,
};
