
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import PARAMETERS from '../config/parameters';

const MapControls = ({ onOverlayToggle, onResetView }) => {
  const [activeOverlay, setActiveOverlay] = useState('markers');

  const handleOverlayChange = (overlay) => {
    setActiveOverlay(overlay);
    onOverlayToggle(overlay);
  };

  return (
    <div className="map-controls">
      <button onClick={() => handleOverlayChange('markers')}>Markers</button>
      <button onClick={() => handleOverlayChange('clusters')}>Clusters</button>
      <button onClick={() => handleOverlayChange('heatmap')}>Heatmap</button>
      <button onClick={onResetView}>Reset View</button>
    </div>
  );
};

MapControls.propTypes = {
  onOverlayToggle: PropTypes.func,
  onResetView: PropTypes.func,
};

export default MapControls;
