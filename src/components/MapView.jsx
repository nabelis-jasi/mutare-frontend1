// src/components/MapView.jsx
import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

// Tile definitions (keep as before)
const TILES = { ... };

// Custom manhole icon
const manholeIcon = (color, size = 20) => L.divIcon({ ... });

// Helper to get color based on properties (optional)
const getManholeColor = (props) => "#28a745"; // default, you can customize

const pointToLayer = (feature, latlng, type) => {
  if (type === 'manhole') {
    return L.marker(latlng, { icon: manholeIcon(getManholeColor(feature.properties), 20) });
  }
  // For suburbs, you might want a polygon style, not point
  return L.marker(latlng);
};

const styleForFeature = (feature, type) => {
  if (type === 'pipeline') {
    return { color: '#2b7bff', weight: 4, opacity: 0.8 };
  }
  if (type === 'suburb') {
    return { color: '#f4a261', weight: 2, fillColor: '#f4a261', fillOpacity: 0.3 };
  }
  return {};
};

const onEachFeature = (feature, layer, type) => {
  if (feature.properties) {
    const props = feature.properties;
    let popupContent = `<b>${type}</b><br/>`;
    for (const [key, val] of Object.entries(props)) {
      popupContent += `${key}: ${val}<br/>`;
    }
    layer.bindPopup(popupContent);
  }
};

// TileManager, MapBootstrap, ZoomReposition, TileSelector (keep as before)
// ...

export default function MapView({ uploadedLayers = [], onFeatureClick }) {
  const [coords, setCoords] = useState("");
  const [activeTiles, setActiveTiles] = useState(["osm"]);
  const [showLegend, setShowLegend] = useState(true);

  // ... (keep TileManager, MapBootstrap, ZoomReposition, TileSelector as before)

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <MapContainer center={[-18.97, 32.67]} zoom={13} style={{ width: "100%", height: "100%" }} zoomControl={false} scrollWheelZoom>
        <ZoomReposition />
        <MapBootstrap onMapReady={() => {}} setCoords={setCoords} pickMode={false} onMapClick={() => {}} />
        <TileManager activeTiles={activeTiles} />

        {uploadedLayers.map(layer => (
          <GeoJSON
            key={layer.id}
            data={layer.geojson}
            pointToLayer={(feature, latlng) => pointToLayer(feature, latlng, layer.type)}
            style={(feature) => styleForFeature(feature, layer.type)}
            onEachFeature={(feature, layer) => {
              onEachFeature(feature, layer, layer.type);
              if (onFeatureClick) {
                layer.on('click', () => onFeatureClick(feature.properties));
              }
            }}
          />
        ))}
      </MapContainer>

      <TileSelector activeTiles={activeTiles} setActiveTiles={setActiveTiles} />

      {showLegend && ( ... )} {/* keep legend */}
      {coords && <div style={{ ... }}>📍 {coords}</div>}
    </div>
  );
}
