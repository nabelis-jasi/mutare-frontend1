import React, { useState, useEffect } from "react";
import Splash from "./components/Splash";
import RoleSelection from "./components/RoleSelection";
import EngineerDashboard from "./components/engineer/EngineerDashboard";
import OperatorDashboard from "./components/fieldOperator/OperatorDashboard";
import CollectorDashboard from "./components/fieldCollector/CollectorDashboard";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [role, setRole] = useState(null);

  if (showSplash) {
    return <Splash onComplete={() => setShowSplash(false)} />;
  }

  if (!role) {
    return <RoleSelection onSelectRole={setRole} />;
  }

  if (role === "engineer") return <EngineerDashboard />;
  if (role === "field-operator") return <OperatorDashboard />;
  if (role === "field-collector") return <CollectorDashboard />;

  return <div>Unknown role</div>;
}
