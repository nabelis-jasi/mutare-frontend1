import MapView from "./MapView";
import ManholeList from "./ManholeList";
import PipeList from "./PipelineList";

export default function Dashboard({ role, userId }) {
  // Sample data (replace with backend fetch later)
  const manholes = [
    { id: 1, status: "Needs Maintenance", plus_code: "X123", geom: { coordinates: [32.67, -18.97] }, flagged: false },
  ];

  const pipes = [
    {
      id: 1,
      status: "Good",
      plus_code: "Y456",
      material: "PVC",
      condition: "Excellent",
      geom: { coordinates: [[32.67, -18.97], [32.68, -18.96]] },
      flagged: false,
    },
  ];

  const roleMessages = {
    engineer: "Full access: edit, upload, delete, and save flags.",
    "field-operator": "You can edit status and maintenance records.",
    "field-collector": "You can collect data and flag points or lines only.",
  };

  // Helper to call backend endpoints with JWT
  const callApi = async (endpoint, method = "POST", body = {}) => {
    const token = localStorage.getItem("access_token");
    try {
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: method !== "GET" ? JSON.stringify(body) : null,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "API Error");
      alert(`Success: ${JSON.stringify(data)}`);
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // Role-specific action buttons
  const renderActions = () => {
    switch (role) {
      case "field-collector":
        return (
          <div className="role-actions">
            <button onClick={() => callApi("/collect-data", "POST", { userId })}>
              Collect Data
            </button>
            <button onClick={() => callApi("/sync-data", "POST", { userId })}>
              Sync Data
            </button>
            <button onClick={() => callApi("/flag-point-line", "POST", { userId })}>
              Flag Point/Line
            </button>
          </div>
        );
      case "field-operator":
        return (
          <div className="role-actions">
            <button onClick={() => callApi("/update-status", "POST", { userId })}>
              Update Status
            </button>
            <button onClick={() => callApi("/sync-updates", "POST", { userId })}>
              Sync Updates
            </button>
          </div>
        );
      case "engineer":
        return (
          <div className="role-actions">
            <button onClick={() => callApi("/edit-records", "POST", { userId })}>
              Edit Records
            </button>
            <button onClick={() => callApi("/engineer-upload", "POST", { userId })}>
              Upload Shapefile/CSV
            </button>
            <button onClick={() => callApi("/delete-features", "POST", { userId })}>
              Delete Features
            </button>
            <button onClick={() => callApi("/sync-data", "POST", { userId })}>
              Sync Data
            </button>
            <button onClick={() => callApi("/save-flags", "POST", { userId })}>
              Save Flags
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  const roles = [
    { name: "Field Operator", key: "field-operator" },
    { name: "Field Collector", key: "field-collector" },
    { name: "Engineer", key: "engineer" },
  ];

  return (
    <div className="dashboard-container">
      <div className={`dashboard-layout role-${role}`}>
        {/* Left half: Map */}
        <section className="map-section">
          <MapView manholes={manholes} pipes={pipes} />
        </section>

        {/* Right half: Role info + actions */}
        <section className="info-section">
          <div className="role-tabs">
            {roles.map((r) => (
              <div key={r.key} className={`role-tab ${r.key === role ? "active" : ""}`}>
                <span className="role-label">{r.name}</span>
              </div>
            ))}
          </div>

          <div className="role-content">
            <h3>Current Role: {role.replace("-", " ")}</h3>
            <p>{roleMessages[role]}</p>

            {/* Role-specific buttons/actions */}
            {renderActions()}

            <div className="lists-section">
              <h4>Manholes</h4>
              <ManholeList manholes={manholes} />

              <h4>Pipes</h4>
              <PipeList pipes={pipes} />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}