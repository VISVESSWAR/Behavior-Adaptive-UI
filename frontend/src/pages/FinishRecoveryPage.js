import { post } from "../api";
import { useEffect, useState } from "react";
import "../styles.css";

export default function FinishRecoveryPage() {
  const [status, setStatus] = useState("Recovering...");

  useEffect(() => {
    async function finish() {
      try {
        const email = localStorage.getItem("email");
        const shares = JSON.parse(localStorage.getItem("shares"));

        if (!email || !shares) {
          setStatus("Missing recovery data");
          return;
        }

        const res = await post("/recover/finish", {
          email,
          shares
        });

        if (res.success) {
          setStatus("Account recovered successfully!");
          // optional: redirect to reset password
        } else {
          setStatus("Recovery failed: Invalid shares");
        }
      } catch (err) {
        setStatus(err.message);
      }
    }

    finish();
  }, []);

  return (
    <div className="page">
      <div className="card">
        <h2>Recovery Result</h2>
        <p>{status}</p>
      </div>
    </div>
  );
}
