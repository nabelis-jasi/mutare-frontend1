
import React from 'react';
import PropTypes from 'prop-types';

const ToggleClustersOverlay = ({ active, onToggle }) => {
  return (
    <div className="toggle-clusters-overlay">
      <label>
        <input type="checkbox" checked={active} onChange={(e) => onToggle(e.target.checked)} />
        Show Clusters
      </label>
    </div>
  );
};

ToggleClustersOverlay.propTypes = {
  active: PropTypes.bool,
  onToggle: PropTypes.func.isRequired,
};

export default ToggleClustersOverlay;
