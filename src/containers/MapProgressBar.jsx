
import React from 'react';
import PropTypes from 'prop-types';

const MapProgressBar = ({ progress }) => {
  return (
    <div className="map-progress-bar">
      <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
    </div>
  );
};

MapProgressBar.propTypes = {
  progress: PropTypes.number,
};

export default MapProgressBar;
