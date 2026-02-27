import { useState, useEffect } from "react";
import { useTask } from "../task/TaskContext.jsx";
import { logEvent } from "../logging/eventLogger.jsx";
import AdaptiveInput from "../components/AdaptiveInput.jsx";
import AdaptiveButton from "../components/AdaptiveButton.jsx";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText.jsx";
import "../styles.css";

const FLOW_ID = "transaction";
const STEP_ID = "create";

export default function TransactionPage() {
  const task = useTask();
  const [amount, setAmount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [note, setNote] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [peers, setPeers] = useState([]);
  const [showPeersDropdown, setShowPeersDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [transactionActive, setTransactionActive] = useState(false);
  const [transactionTimer, setTransactionTimer] = useState(0);
  const [peersLoading, setPeersLoading] = useState(true);

  // Start task on mount
  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      timestamp: new Date().toISOString(),
    });

    task.startTask("transaction_task", 60000); // 60 second limit

    // Fetch peers from API
    fetchPeers();
  }, []);

  // Fetch peers from backend
  const fetchPeers = async () => {
    try {
      setPeersLoading(true);
      const response = await fetch("http://localhost:5000/peer/users", {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPeers(data);
      } else {
        console.error("Failed to fetch peers:", response.statusText);
        setError("Failed to load peers list");
      }
    } catch (err) {
      console.error("Error fetching peers:", err);
      setError("Error loading peers list");
    } finally {
      setPeersLoading(false);
    }
  };

  // Auto-complete transaction after 10 seconds
  useEffect(() => {
    if (!transactionActive) return;

    const interval = setInterval(() => {
      setTransactionTimer((prev) => {
        const newTime = prev + 1;
        
        // Auto-complete at 10 seconds
        if (newTime >= 10) {
          completeTransactionAuto();
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [transactionActive]);

  // Handle receiver selection from dropdown
  const handleReceiverSelect = (peerEmail) => {
    task.logStep("receiver_selected_from_dropdown");
    setReceiver(peerEmail);
    setShowPeersDropdown(false);

    logEvent({
      type: "receiver_selected",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      receiverEmail: peerEmail,
    });
  };

  // Toggle advanced options
  const toggleAdvanced = () => {
    task.logStep("advanced_toggle");
    setShowAdvanced(!showAdvanced);

    logEvent({
      type: "advanced_options_toggled",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      expanded: !showAdvanced,
    });
  };

  // Auto-complete transaction (called at 10s)
  const completeTransactionAuto = () => {
    if (window.__metricsCollector) {
      const completedTxn = window.__metricsCollector.completeTransaction("auto");
      console.log("[TransactionPage] Auto-completed transaction:", completedTxn);
    }
    
    setTransactionActive(false);
    setTransactionTimer(0);
    
    logEvent({
      type: "transaction_auto_completed",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      timestamp: new Date().toISOString(),
    });
  };

  // User-initiated transaction completion
  const completeTransactionUser = () => {
    if (window.__metricsCollector) {
      const completedTxn = window.__metricsCollector.completeTransaction("user");
      console.log("[TransactionPage] User-completed transaction:", completedTxn);
    }
    
    setTransactionActive(false);
    setTransactionTimer(0);
    
    logEvent({
      type: "transaction_user_completed",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      timestamp: new Date().toISOString(),
    });
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validation
    if (!amount || !receiver) {
      setError("Amount and receiver are required");
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    task.logStep("submit_click");

    // Get current pathType from metrics collector for logging
    const pathType = window.__metricsCollector?.pathType || "unknown";
    console.log(`PATH: ${pathType}`);

    logEvent({
      type: "transaction_submit",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      amount: parseFloat(amount),
      receiver,
      hasNote: note.length > 0,
      pathType: pathType,
    });

    // Start transaction in metrics collector
    if (window.__metricsCollector) {
      const txnId = window.__metricsCollector.startTransaction();
      console.log("[TransactionPage] Transaction started:", txnId);
      console.log(`[TransactionPage] Path type: ${pathType}`);
      setTransactionActive(true);
      setTransactionTimer(0);
    }

    setLoading(true);
    setError("");

    // Simulate API call with success
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      task.completeTask();

      logEvent({
        type: "transaction_success",
        flowId: FLOW_ID,
        stepId: STEP_ID,
        amount: parseFloat(amount),
        receiver,
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        setAmount("");
        setReceiver("");
        setNote("");
        setShowAdvanced(false);
        setSuccess(false);
      }, 2000);
    }, 1500);
  };

  return (
    <div className="page">
      <div className="card">
        <AdaptiveHeading level={2}>Create Transaction</AdaptiveHeading>

        {success && (
          <div
            style={{
              padding: "10px",
              marginBottom: "15px",
              backgroundColor: "#d4edda",
              color: "#155724",
              borderRadius: "4px",
              border: "1px solid #c3e6cb",
            }}
          >
            ✓ Transaction created successfully!
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "10px",
              marginBottom: "15px",
              backgroundColor: "#f8d7da",
              color: "#721c24",
              borderRadius: "4px",
              border: "1px solid #f5c6cb",
            }}
          >
            ✗ {error}
          </div>
        )}

        {/* Amount Field */}
        <AdaptiveInput
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          onFocus={() => {
            task.logStep("amount_focus");
            logEvent({
              type: "focus_amount",
              flowId: FLOW_ID,
              stepId: STEP_ID,
            });
          }}
          disabled={loading || success}
        />

        {/* Receiver Field with Dropdown */}
        <div style={{ position: "relative", marginBottom: "10px" }}>
          <div
            onClick={() => setShowPeersDropdown(!showPeersDropdown)}
            style={{
              padding: "10px",
              border: "1px solid #ddd",
              borderRadius: "4px",
              backgroundColor: "white",
              cursor: "pointer",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: "40px",
              fontSize: "16px",
              color: receiver ? "#000" : "#999",
            }}
          >
            <span>{receiver || "Select Recipient"}</span>
            <span style={{ fontSize: "12px" }}>{showPeersDropdown ? "▲" : "▼"}</span>
          </div>

          {/* Peers Dropdown */}
          {showPeersDropdown && (
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                backgroundColor: "white",
                border: "1px solid #ddd",
                borderTop: "none",
                borderRadius: "0 0 4px 4px",
                maxHeight: "250px",
                overflowY: "auto",
                zIndex: 1000,
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
              }}
            >
              {peersLoading ? (
                <div style={{ padding: "10px", textAlign: "center", color: "#999" }}>
                  Loading peers...
                </div>
              ) : peers.length > 0 ? (
                peers.map((peer) => (
                  <div
                    key={peer.email}
                    onClick={() => handleReceiverSelect(peer.email)}
                    style={{
                      padding: "10px 15px",
                      cursor: "pointer",
                      borderBottom: "1px solid #f0f0f0",
                      backgroundColor: receiver === peer.email ? "#e3f2fd" : "white",
                      transition: "background-color 0.2s",
                      fontWeight: receiver === peer.email ? "bold" : "normal",
                    }}
                    onMouseEnter={(e) => {
                      if (receiver !== peer.email) {
                        e.currentTarget.style.backgroundColor = "#f9f9f9";
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 
                        receiver === peer.email ? "#e3f2fd" : "white";
                    }}
                  >
                    {peer.email}
                  </div>
                ))
              ) : (
                <div style={{ padding: "10px", textAlign: "center", color: "#999" }}>
                  No peers available
                </div>
              )}
            </div>
          )}
        </div>

        {/* Advanced Options Toggle */}
        <AdaptiveButton
          onClick={toggleAdvanced}
          style={{
            background: "#f0f0f0",
            color: "#333",
            marginBottom: "10px",
            width: "100%",
            textAlign: "left",
          }}
          disabled={loading || success}
        >
          {showAdvanced ? "▼" : "▶"} Advanced Options
        </AdaptiveButton>

        {/* Advanced Options Section - Collapsible */}
        {showAdvanced && (
          <div style={{ marginBottom: "15px" }}>
            <AdaptiveInput
              placeholder="Note (Optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onFocus={() => {
                task.logStep("note_focus");
                logEvent({
                  type: "focus_note",
                  flowId: FLOW_ID,
                  stepId: STEP_ID,
                });
              }}
              disabled={loading || success}
            />
          </div>
        )}

        {/* Submit Button */}
        <AdaptiveButton
          onClick={handleSubmit}
          disabled={loading || success || transactionActive}
          style={{
            opacity: loading || success || transactionActive ? 0.6 : 1,
            cursor: loading || success || transactionActive ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Processing..." : success ? "Sent!" : "Send Transaction"}
        </AdaptiveButton>

        {/* Transaction Status Display */}
        {transactionActive && (
          <div
            style={{
              marginTop: "15px",
              padding: "12px",
              backgroundColor: "#e3f2fd",
              border: "1px solid #2196f3",
              borderRadius: "4px",
              textAlign: "center",
            }}
          >
            <AdaptiveParagraph style={{ marginBottom: "10px", fontWeight: "bold" }}>
              💳 Transaction in Progress
            </AdaptiveParagraph>
            <AdaptiveParagraph style={{ marginBottom: "10px", fontSize: "14px" }}>
              Time elapsed: {transactionTimer}s / 10s
            </AdaptiveParagraph>
            
            {/* Progress bar */}
            <div
              style={{
                width: "100%",
                height: "4px",
                backgroundColor: "#ddd",
                borderRadius: "2px",
                marginBottom: "10px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  backgroundColor: "#2196f3",
                  width: `${(transactionTimer / 10) * 100}%`,
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <AdaptiveParagraph style={{ fontSize: "12px", marginBottom: "10px" }}>
              Transaction will auto-complete in {10 - transactionTimer}s, or you can complete it now.
            </AdaptiveParagraph>

            {/* Complete button */}
            <AdaptiveButton
              onClick={completeTransactionUser}
              style={{
                backgroundColor: "#ff9800",
                width: "100%",
              }}
            >
              ✓ Complete Transaction Now
            </AdaptiveButton>
          </div>
        )}

        {/* Info */}
        <AdaptiveParagraph style={{ marginTop: "15px", fontSize: "12px" }}>
          This is a demo transaction form. No real transactions are processed.
        </AdaptiveParagraph>
      </div>
    </div>
  );
}
