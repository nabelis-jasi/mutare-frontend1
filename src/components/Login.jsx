import { useState } from "react";
import { supabase } from "../supabaseClient";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    // Login via Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      setError(error.message);
      return;
    }

    // Check if user is approved
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (!profile.is_active) {
      setError("Your account is not approved yet.");
      return;
    }

    // Store JWT and role
    localStorage.setItem("access_token", data.session.access_token);
    localStorage.setItem("role", profile.role);

    // Notify parent
    onLogin(profile.role);
  };

  return (
    <div className="login-container">
      <h1>WASTEWATER GIS</h1>
      <form onSubmit={handleLogin}>
        <div>
          <label>Email:</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Password:</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        <button type="submit">Login</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}