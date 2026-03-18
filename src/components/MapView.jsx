import { MapContainer, TileLayer, Marker, Popup, Polyline, LayersControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";

export default function MapView({ manholes = [], pipes = [] }) {
  const legendStyle = {
    position: "absolute",
    bottom: "10px",
    left: "10px",
    background: "white",
    padding: "8px",
    borderRadius: "4px",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
    zIndex: 1000,
    fontSize: "12px",
  };

  return (
    <div style={{ position: "relative" }}>
      <MapContainer center={[-18.97, 32.67]} zoom={13} style={{ height: "70vh", width: "100%" }}>
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer attribution="OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Esri World Imagery">
            <TileLayer attribution="Esri" url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}" />
          </LayersControl.BaseLayer>

          {/* Google Hybrid: To use Google Hybrid you must add a Google Maps Tile layer plugin
              (e.g. leaflet.gridlayer.googlemutant) and supply a Google API key. Example (requires installing the plugin):
              import 'leaflet.gridlayer.googlemutant';
              <LayersControl.BaseLayer name="Google Hybrid">
                <TileLayer url="https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" subdomains={["mt0","mt1","mt2","mt3"]} />
              </LayersControl.BaseLayer>
              Note: using Google tiles requires following Google's terms of service and proper API key usage.
          */}
        </LayersControl>

        {manholes.map((m) => (
          <Marker key={m.id} position={[m.geom.coordinates[1], m.geom.coordinates[0]]}>
            <Popup>
              ID: {m.id} <br /> Status: {m.status} <br /> Plus Code: {m.plus_code}
            </Popup>
          </Marker>
        ))}

        {pipes.map((p, idx) => (
          <Polyline key={idx} positions={p.geom.coordinates.map(([lon, lat]) => [lat, lon])} color="blue" />
        ))}
      </MapContainer>

      <div style={legendStyle} className="map-legend">
        <div style={{ fontWeight: 600, marginBottom: 6 }}>Legend</div>
        <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#2b7bff', marginRight: 6 }}></span>Pipeline</div>
        <div style={{ marginTop: 6 }}><span style={{ display: 'inline-block', width: 12, height: 12, background: '#28a745', marginRight: 6 }}></span>Manhole - OK</div>
        <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#ffc107', marginRight: 6 }}></span>Manhole - Needs Maintenance</div>
        <div><span style={{ display: 'inline-block', width: 12, height: 12, background: '#dc3545', marginRight: 6 }}></span>Manhole - Out Of Service</div>
      </div>
    </div>
  );
}