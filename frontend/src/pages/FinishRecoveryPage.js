import { post } from "../api";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

export default function FinishRecoveryPage() {
  const [status, setStatus] = useState("Recovering...");
  const navigate = useNavigate();

  useEffect(() => {
    async function finish() {
      try {
        const email = localStorage.getItem("email");
        const shares = JSON.parse(localStorage.getItem("shares"));

        if (!email || !shares) {
          setStatus("Missing recovery data");
          return;
        }

        await post("/recover/finish", {
          email,
          shares
        });

        // ✅ Clear used recovery material
        localStorage.removeItem("shares");

        // ✅ Go to common password reset page
        navigate("/reset-password");

      } catch (err) {
        setStatus(err.message || "Recovery failed");
      }
    }

    finish();
  }, [navigate]);

  return (
    <div className="page">
      <div className="card">
        <h2>Recovery Result</h2>
        <p>{status}</p>
      </div>
    </div>
  );
}
