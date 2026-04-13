// src/App.jsx
import React, { useState, useEffect } from "react";
import api from "./api/api";
import Splash from "./components/Splash";
import RoleSelection from "./components/RoleSelection";

// Role-based dashboards
import CollectorDashboard from "./components/fieldCollector/CollectorDashboard";
import OperatorDashboard from "./components/fieldOperator/OperatorDashboard";
import EngineerDashboard from "./components/engineer/EngineerDashboard";
import AdminApprove from "./components/AdminApprove";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [selectedRole, setSelectedRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  const [manholes, setManholes] = useState([]);
  const [pipes, setPipes] = useState([]);

  const handleSplashComplete = () => setShowSplash(false);

  const handleRoleSelect = (roleId) => {
    // Demo mode: automatically authenticate with the selected role
    setRole(roleId);
    setUserId(1); // dummy user id
    setIsAuthenticated(true);
    setSelectedRole(null);
    fetchData();
  };

  const fetchData = async () => {
    try {
      const [manholesRes, pipesRes] = await Promise.all([
        api.get("/manholes"),
        api.get("/pipelines")
      ]);
      setManholes(manholesRes.data || []);
      setPipes(pipesRes.data || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleLogout = async () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    setRole(null);
    setUserId(null);
    setSelectedRole(null);
    setShowSplash(true);
    setManholes([]);
    setPipes([]);
  };

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");
      if (token && storedUser) {
        try {
          const user = JSON.parse(storedUser);
          await api.get("/me");
          setRole(user.role);
          setUserId(user.id);
          setIsAuthenticated(true);
          setShowSplash(false);
          await fetchData();
        } catch (err) {
          localStorage.removeItem("token");
          localStorage.removeItem("user");
        }
      }
      setLoading(false);
    };
    checkSession();
  }, []);

  // Global full‑screen styles
  useEffect(() => {
    const style = document.createElement("style");
    style.textContent = `
      html, body, #root {
        margin: 0;
        padding: 0;
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      * {
        box-sizing: border-box;
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const handleDataRefresh = () => fetchData();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh"
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (showSplash) {
    return <Splash onComplete={handleSplashComplete} />;
  }

  if (isAuthenticated) {
    return (
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f0f2f5"
      }}>
        <main style={{ flex: 1, overflow: "hidden" }}>
          
          {role === "field-collector" && (
            <CollectorDashboard
              manholes={manholes}
              pipes={pipes}
              userId={userId}
              role={role}
              onDataRefresh={handleDataRefresh}
              onLogout={handleLogout}
            />
          )}

          {role === "field-operator" && (
            <OperatorDashboard
              manholes={manholes}
              pipes={pipes}
              userId={userId}
              role={role}
              onDataRefresh={handleDataRefresh}
              onLogout={handleLogout}
            />
          )}

          {role === "engineer" && (
            <EngineerDashboard
              manholes={manholes}
              pipes={pipes}
              userId={userId}
              role={role}
              onDataRefresh={handleDataRefresh}
              onLogout={handleLogout}
            />
          )}

          {role === "admin" && (
            <div style={{ padding: "2rem", height: "100%", overflow: "auto" }}>
              <AdminApprove userId={userId} />
            </div>
          )}

        </main>
      </div>
    );
  }

  // No authenticated session → show role selection
  return <RoleSelection onSelectRole={handleRoleSelect} />;
}
