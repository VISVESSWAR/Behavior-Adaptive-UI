import { Html5QrcodeScanner } from "html5-qrcode";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function ScanQRPage() {
  const [shares, setShares] = useState([]);
  const navigate = useNavigate();

  const email = localStorage.getItem("email");
  const threshold = Number(localStorage.getItem("threshold"));

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "reader",
      { fps: 10, qrbox: 250 }
    );

    scanner.render((decodedText) => {
      const data = JSON.parse(decodedText);

      if (data.email !== email) {
        alert("This QR is not for this account");
        return;
      }

      setShares(prev => {
        const updated = [...prev, { x: data.x, y: data.y }];
        if (updated.length === threshold) {
          localStorage.setItem("shares", JSON.stringify(updated));
          navigate("/result");
        }
        return updated;
      });
    });

  }, [email, threshold, navigate]);

  return (
    <div className="container">
      <h2>Scan Peer QR Codes</h2>
      <div id="reader"></div>
      <p>Collected: {shares.length} / {threshold}</p>
    </div>
  );
}
