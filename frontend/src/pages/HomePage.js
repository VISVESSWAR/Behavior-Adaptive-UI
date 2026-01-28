import { useEffect, useState } from "react";
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
  const [requests, setRequests] = useState([]);   // ✅ NEW
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      view,
      timestamp: new Date().toISOString(),
    });

    const token = localStorage.getItem("token");
    let url = "";

    if (view === "qr") url = "/home/shared-qr";
    if (view === "peers") url = "/home/peer-details";
    if (view === "requests") url = "/recover/tap/requests"; // ✅ NEW

    setLoading(true);
    fetch("http://localhost:5000" + url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((r) => r.json())
      .then((d) => {
        if (view === "qr") setQrList(d);
        if (view === "peers") setPeers(d.peers);
        if (view === "requests") setRequests(d); // ✅ NEW

        logEvent({
          type: "data_loaded",
          flowId: FLOW_ID,
          stepId: STEP_ID,
          view,
          itemCount: Array.isArray(d) ? d.length : d.peers?.length || 0,
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

  // ✅ NEW: approve / decline handler
  async function respond(requestId, decision) {
    const token = localStorage.getItem("token");

    await fetch("http://localhost:5000/recover/tap/respond", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ requestId, decision })
    });

    // refresh list
    setRequests(prev => prev.filter(r => r.id !== requestId));
  }

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
          <option value="requests">Recovery Requests</option> {/* ✅ NEW */}
        </select>

        {loading && <AdaptiveParagraph>Loading...</AdaptiveParagraph>}

        {/* ================= QR LIST ================= */}
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

        {/* ================= PEER LIST ================= */}
        {!loading && view === "peers" &&
          (peers.length > 0 ? (
            peers.map((p, i) => (
              <AdaptiveParagraph key={i}>{p}</AdaptiveParagraph>
            ))
          ) : (
            <AdaptiveParagraph>No peer details available.</AdaptiveParagraph>
          ))}

        {/* ================= TAP-YES REQUESTS ================= */}
        {!loading && view === "requests" &&
          (requests.length > 0 ? (
            requests.map((r) => (
              <div key={r.id} className="qr-box">
                <AdaptiveParagraph>
                  Recovery request from <strong>{r.owner_email}</strong>
                </AdaptiveParagraph>

                <AdaptiveButton onClick={() => respond(r.id, "approved")}>
                  Approve
                </AdaptiveButton>

                <AdaptiveButton
                  variant="secondary"
                  onClick={() => respond(r.id, "declined")}
                >
                  Decline
                </AdaptiveButton>
              </div>
            ))
          ) : (
            <AdaptiveParagraph>No pending recovery requests.</AdaptiveParagraph>
          ))}
      </div>
    </div>
  );
}
