import { useEffect, useState } from "react";
import { useTask } from "../task/TaskContext.jsx";
import { logEvent } from "../logging/eventLogger.jsx";
import "../styles.css";
import HelpBar from "../components/HelpBar.jsx";

export default function TapWaitPage() {
  const task = useTask();
  const [count, setCount] = useState(0);
  const threshold = Number(localStorage.getItem("threshold"));
  const email = localStorage.getItem("email");

  // Start task on mount
  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: "recovery",
      stepId: "tap_wait",
      timestamp: new Date().toISOString(),
    });
    
    task.startPageTask("tap_wait");
  }, [task]);

  useEffect(() => {
    const interval = setInterval(async () => {
      const res = await fetch(
        `http://localhost:5000/recover/tap/shares/${email}`
      );
      const shares = await res.json();

      setCount(shares.length);

      if (shares.length >= threshold) {
        // ✅ FIX: store under SAME key used by QR flow
        localStorage.setItem("shares", JSON.stringify(shares));

        clearInterval(interval);
        window.location.href = "/finish";
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [email, threshold]);

  return (
    <>
      <HelpBar pageId="recovery" />
      <div className="page">
      <div className="card">
        <h2>Waiting for Peer Approval</h2>
        <p>Approved peers: {count} / {threshold}</p>
        <p>Please wait while your peers approve recovery.</p>
      </div>
      </div>
    </>
  );
}
