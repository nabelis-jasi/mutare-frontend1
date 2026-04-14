// src/containers/DrawerEntry.jsx
import React from 'react';
import PropTypes from 'prop-types';

const DrawerEntry = ({ entry, onClose }) => {
  if (!entry) return null;

  return (
    <div className="drawer drawer-entry">
      <div className="drawer-header">
        <h3>Entry Details</h3>
        <button className="drawer-close" onClick={onClose}>✕</button>
      </div>
      <div className="drawer-body">
        <pre>{JSON.stringify(entry, null, 2)}</pre>
      </div>
    </div>
  );
};

DrawerEntry.propTypes = {
  entry: PropTypes.object,
  onClose: PropTypes.func.isRequired,
};

export default DrawerEntry;
