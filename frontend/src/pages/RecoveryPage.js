import { useState } from "react";
import { post } from "../api";
import { useNavigate } from "react-router-dom";

export default function RecoveryPage() {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  async function startRecovery() {
    const res = await post("/recover/start", { email });

    localStorage.setItem("email", email);
    localStorage.setItem("threshold", res.threshold);
    navigate("/scan");
  }

  return (
    <div className="container">
      <h2>Start Recovery</h2>

      <input placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)} />

      <button onClick={startRecovery}>Continue</button>
    </div>
  );
}
