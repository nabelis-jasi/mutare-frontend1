
import React from 'react';
import PropTypes from 'prop-types';
import MapView from '../components/MapView';

const Map = ({ manholes, pipelines, onFeatureClick }) => {
  return (
    <div className="map-container">
      <MapView
        manholes={manholes}
        pipes={pipelines}
        onFeatureClick={onFeatureClick}
      />
    </div>
  );
};

Map.propTypes = {
  manholes: PropTypes.array,
  pipelines: PropTypes.array,
  onFeatureClick: PropTypes.func,
};

export default Map;
