// RequestAccess.jsx
import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function RequestAccess() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const handleRequest = async () => {
    const { data, error } = await supabase
      .from("access_requests")
      .insert([{ email, status: "pending" }]);

    if (error) setMessage("Error submitting request.");
    else setMessage("Request submitted! Wait for approval.");
  };

  return (
    <div>
      <h2>Request Access</h2>
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <button onClick={handleRequest}>Submit</button>
      {message && <p>{message}</p>}
    </div>
  );
}