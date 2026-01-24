import { useEffect, useState } from "react";
import "../styles.css";

export default function HomePage() {
  const [view, setView] = useState("qr");
  const [qrList, setQrList] = useState([]);
  const [peers, setPeers] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const url =
      view === "qr"
        ? "/home/shared-qr"
        : "/home/peer-details";

    fetch("http://localhost:5000" + url, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(d => view === "qr" ? setQrList(d) : setPeers(d.peers));
  }, [view]);

  return (
    <div className="page">
      <div className="card wide">
        <h2>Dashboard</h2>

        <select value={view} onChange={e => setView(e.target.value)}>
          <option value="qr">List Shared QR</option>
          <option value="peers">Peer Details</option>
        </select>

        {view === "qr" &&
          qrList.map((q, i) => (
            <div key={i} className="qr-box">
              <p>Owner: {q.owner}</p>
              <img src={q.qr} alt="QR" />
            </div>
          ))}

        {view === "peers" &&
          peers.map((p, i) => <p key={i}>{p}</p>)}
      </div>
    </div>
  );
}
