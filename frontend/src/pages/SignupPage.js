import { useState } from "react";
import { post } from "../api";
import "../styles.css";

export default function SignupPage() {
  const [mode, setMode] = useState("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [numPeers, setNumPeers] = useState(3);
  const [threshold, setThreshold] = useState(2);
  const [peers, setPeers] = useState(["", "", ""]);

  async function signup() {
    try {
      const payload =
        mode === "password"
          ? { email, password, mode }
          : { email, password, mode, numPeers, threshold, peers };

      await post("/signup", payload);
      alert("Signup successful. You can login now.");
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="page">
      <div className="card">
        <h2>Signup</h2>

        <select value={mode} onChange={e => setMode(e.target.value)}>
          <option value="password">Normal Signup</option>
          <option value="peer">Peer-based Recovery</option>
        </select>

        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password"
               onChange={e => setPassword(e.target.value)} />

        {mode === "peer" && (
          <>
            <input
              placeholder="Number of Peers (n)"
              value={numPeers}
              onChange={e => {
                const n = Number(e.target.value);
                setNumPeers(n);
                setPeers(Array(n).fill(""));
              }}
            />
            <input
              placeholder="Threshold (k)"
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
            />

            {peers.map((p, i) => (
              <input
                key={i}
                placeholder={`Peer ${i + 1} Email`}
                onChange={e => {
                  const copy = [...peers];
                  copy[i] = e.target.value;
                  setPeers(copy);
                }}
              />
            ))}
          </>
        )}

        <button onClick={signup}>Signup</button>
      </div>
    </div>
  );
}
