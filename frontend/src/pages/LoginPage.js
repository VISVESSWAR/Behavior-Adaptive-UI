import { useState } from "react";
import { post } from "../api";
import { useNavigate, Link } from "react-router-dom";
import "../styles.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  async function login() {
    try {
      const res = await post("/auth/login", { email, password });
      localStorage.setItem("token", res.token);
      nav("/home");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Login</h2>

        <input
          placeholder="Email"
          onChange={e => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          onChange={e => setPassword(e.target.value)}
        />

        <button onClick={login}>Login</button>

        <p className="link">
          New user? <Link to="/signup">Signup here</Link>
        </p>
      </div>
    </div>
  );
}
