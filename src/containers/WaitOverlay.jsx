
import React from 'react';
import PropTypes from 'prop-types';

const WaitOverlay = ({ isVisible, message }) => {
  if (!isVisible) return null;

  return (
    <div className="wait-overlay">
      <div className="wait-spinner"></div>
      <div className="wait-message">{message || 'Loading...'}</div>
    </div>
  );
};

WaitOverlay.propTypes = {
  isVisible: PropTypes.bool,
  message: PropTypes.string,
};

export default WaitOverlay;
