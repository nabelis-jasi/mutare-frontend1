import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import LandingPortal from "./components/LandingPortal";
import Splash from "./components/Splash";
import Signup from "./components/Signup";
import RequestAccess from "./components/RequestAccess";
import Login from "./components/Login";
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
  const [activePortal, setActivePortal] = useState(null);
  const [loading, setLoading] = useState(true);

  const [manholes, setManholes] = useState([]);
  const [pipes, setPipes] = useState([]);

  const handleSplashComplete = () => setShowSplash(false);

  const handleRoleSelect = (roleId) => setSelectedRole(roleId);

  const handleBackToRoles = () => {
    setSelectedRole(null);
    setActivePortal(null);
  };

  const fetchData = async () => {
    try {
      const { data: manholesData } = await supabase
        .from("waste_water_manhole")
        .select("*");

      const { data: pipesData } = await supabase
        .from("waste_water_pipeline")
        .select("*");

      setManholes(manholesData || []);
      setPipes(pipesData || []);
    } catch (err) {
      console.error("Error fetching data:", err);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user.id)
        .single();

      if (profileError) throw profileError;

      if (!profile.is_active) {
        alert("Your account is pending admin approval.");
        return;
      }

      if (profile.role !== selectedRole) {
        alert(`This account is registered as ${profile.role}. Select the correct role.`);
        return;
      }

      localStorage.setItem("access_token", data.session.access_token);
      localStorage.setItem("role", profile.role);
      localStorage.setItem("user_id", data.user.id);

      setRole(profile.role);
      setUserId(data.user.id);
      setIsAuthenticated(true);
      setSelectedRole(null);
      setActivePortal(null);

      await fetchData();
    } catch (error) {
      alert(error.message);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setRole(null);
    setUserId(null);
    setSelectedRole(null);
    setShowSplash(true);
    setActivePortal(null);
    setManholes([]);
    setPipes([]);
    localStorage.clear();
  };

  useEffect(() => {
    const checkSession = async () => {
      setLoading(true);
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.session.user.id)
          .single();

        if (profile && profile.is_active) {
          setIsAuthenticated(true);
          setRole(profile.role);
          setUserId(data.session.user.id);
          setShowSplash(false);

          await fetchData();
        }
      }
      setLoading(false);
    };

    checkSession();
  }, []);

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
            />
          )}

          {role === "field-operator" && (
            <OperatorDashboard
              manholes={manholes}
              pipes={pipes}
              userId={userId}
              role={role}
              onDataRefresh={handleDataRefresh}
            />
          )}

          {role === "engineer" && (
            <EngineerDashboard
              manholes={manholes}
              pipes={pipes}
              userId={userId}
              role={role}
              onDataRefresh={handleDataRefresh}
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

  if (!selectedRole) {
    return <RoleSelection onSelectRole={handleRoleSelect} />;
  }

  if (activePortal === "login") {
    return (
      <Login
        selectedRole={selectedRole}
        onLoginSuccess={handleLogin}
        onBack={() => setActivePortal(null)}
      />
    );
  }

  if (activePortal === "signup") {
    return (
      <Signup
        selectedRole={selectedRole}
        onBack={() => setActivePortal(null)}
      />
    );
  }

  if (activePortal === "request") {
    return (
      <RequestAccess
        selectedRole={selectedRole}
        onBack={() => setActivePortal(null)}
      />
    );
  }

  return (
    <LandingPortal
      selectedRole={selectedRole}
      setActivePortal={setActivePortal}
      onBackToRoles={handleBackToRoles}
    />
  );
}
