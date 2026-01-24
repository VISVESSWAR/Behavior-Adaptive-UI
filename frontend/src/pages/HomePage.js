import { useEffect, useState } from "react";
import useMouseTracker from "../hooks/useMouseTracker";
import useIdleTimer from "../hooks/useIdleTimer";
import useScrollDepth from "../hooks/useScrollDepth";
import { logEvent } from "../logging/eventLogger";
import AdaptiveButton from "../components/AdaptiveButton";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText";
import "../styles.css";

const FLOW_ID = "dashboard";
const STEP_ID = "home";

export default function HomePage() {
  const [view, setView] = useState("qr");
  const [qrList, setQrList] = useState([]);
  const [peers, setPeers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Metrics collection for this page
  useMouseTracker(FLOW_ID, STEP_ID);
  useIdleTimer(FLOW_ID, STEP_ID);
  useScrollDepth(FLOW_ID, STEP_ID);

  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      view,
      timestamp: new Date().toISOString(),
    });

    const token = localStorage.getItem("token");
    const url =
      view === "qr"
        ? "/home/shared-qr"
        : "/home/peer-details";

    setLoading(true);
    fetch("http://localhost:5000" + url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        view === "qr" ? setQrList(d) : setPeers(d.peers);
        logEvent({
          type: "data_loaded",
          flowId: FLOW_ID,
          stepId: STEP_ID,
          view,
          itemCount: view === "qr" ? d.length : d.peers?.length || 0,
        });
      })
      .catch((err) => {
        logEvent({
          type: "data_error",
          flowId: FLOW_ID,
          stepId: STEP_ID,
          error: err.message,
        });
      })
      .finally(() => setLoading(false));
  }, [view]);

  return (
    <div className="page">
      <div className="card wide">
        <AdaptiveHeading level={2}>Dashboard</AdaptiveHeading>

        <select
          value={view}
          onChange={(e) => setView(e.target.value)}
          style={{ marginBottom: "20px", padding: "8px" }}
        >
          <option value="qr">List Shared QR</option>
          <option value="peers">Peer Details</option>
        </select>

        {loading && <AdaptiveParagraph>Loading...</AdaptiveParagraph>}

        {!loading && view === "qr" &&
          (qrList.length > 0 ? (
            qrList.map((q, i) => (
              <div key={i} className="qr-box">
                <AdaptiveParagraph>Owner: {q.owner}</AdaptiveParagraph>
                <img src={q.qr} alt="QR" style={{ maxWidth: "200px" }} />
              </div>
            ))
          ) : (
            <AdaptiveParagraph>No shared QR codes available.</AdaptiveParagraph>
          ))}

        {!loading && view === "peers" &&
          (peers.length > 0 ? (
            peers.map((p, i) => (
              <AdaptiveParagraph key={i}>{p}</AdaptiveParagraph>
            ))
          ) : (
            <AdaptiveParagraph>No peer details available.</AdaptiveParagraph>
          ))}
      </div>
    </div>
  );
}
