import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles.css";

export default function ScanQRPage() {
  const [shares, setShares] = useState([]);
  const navigate = useNavigate();

  const email = localStorage.getItem("email");
  const threshold = Number(localStorage.getItem("threshold"));

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 },
      false
    );

    scanner.render((decodedText) => {
      try {
        const data = JSON.parse(decodedText);

        // Validate QR ownership
        if (data.email !== email) {
          alert("This QR is not for this account");
          return;
        }

        setShares(prev => {
          // Prevent duplicate peer shares
          if (prev.some(s => s.x === data.x)) return prev;

          const updated = [...prev, { x: data.x, y: data.y }];

          if (updated.length === threshold) {
            localStorage.setItem("shares", JSON.stringify(updated));
            scanner.clear(); // stop camera
            navigate("/finish"); // unified finish page
          }

          return updated;
        });

      } catch {
        alert("Invalid QR code");
      }
    });

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [email, threshold, navigate]);

  return (
    <div className="page">
      <div className="card wide">
        <h2>Scan Peer QR Codes</h2>
        <div id="reader"></div>
        <p>Collected: {shares.length} / {threshold}</p>
      </div>
    </div>
  );
}
