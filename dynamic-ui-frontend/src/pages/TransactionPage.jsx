import { useState, useEffect } from "react";
import { useTask } from "../task/TaskContext.jsx";
import { logEvent } from "../logging/eventLogger.jsx";
import AdaptiveInput from "../components/AdaptiveInput.jsx";
import AdaptiveButton from "../components/AdaptiveButton.jsx";
import { AdaptiveHeading, AdaptiveParagraph } from "../components/AdaptiveText.jsx";
import "../styles.css";

const FLOW_ID = "transaction";
const STEP_ID = "create";

// Available transaction paths for multi-path experiment
const TRANSACTION_PATHS = [
  "bank_transfer",
  "upi_payment",
  "qr_payment"
];

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
  
  // Multi-path transaction support
  const [pathType, setPathType] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [ifscCode, setIfscCode] = useState("");
  const [upiId, setUpiId] = useState("");
  const [qrScanned, setQrScanned] = useState(false);
  const [confirmData, setConfirmData] = useState(null);

  // Start task on mount
  useEffect(() => {
    logEvent({
      type: "page_view",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      timestamp: new Date().toISOString(),
    });

    task.startTask("transaction_task", 60000); // 60 second limit

    // Get pathType from metrics collector if available, otherwise assign random one
    let assignedPathType = null;
    if (window.__metricsCollector?.pathType) {
      assignedPathType = window.__metricsCollector.pathType;
    } else {
      assignedPathType = TRANSACTION_PATHS[Math.floor(Math.random() * TRANSACTION_PATHS.length)];
    }
    
    setPathType(assignedPathType);
    console.log("TRANSACTION PATH:", assignedPathType);

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

  // Handle form submission for initial step (varies by path type)
  const handleSubmit = async () => {
    // Validation based on current path
    let isValid = true;

    if (!amount || !receiver) {
      setError("Amount and receiver are required");
      return;
    }

    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    // Path-specific validation
    if (pathType === "bank_transfer" && currentStep === 0) {
      // Step 1: Account number validation
      setConfirmData({ amount, receiver });
      setCurrentStep(1);
      setError("");
      return;
    }

    if (pathType === "bank_transfer" && currentStep === 1) {
      // Step 2: IFSC code
      if (!ifscCode) {
        setError("IFSC code is required");
        return;
      }
      setCurrentStep(2);
      setError("");
      return;
    }

    if (pathType === "bank_transfer" && currentStep === 2) {
      // Step 3: Confirm
      setCurrentStep(3);
      setError("");
      return;
    }

    if (pathType === "bank_transfer" && currentStep === 3) {
      // Step 4: OTP
      setCurrentStep(4);
      setError("");
      return;
    }

    if (pathType === "upi_payment" && currentStep === 0) {
      // Step 1: UPI ID
      if (!upiId) {
        setError("UPI ID is required");
        return;
      }
      setConfirmData({ amount, receiver, upiId });
      setCurrentStep(1);
      setError("");
      return;
    }

    if (pathType === "upi_payment" && currentStep === 1) {
      // Step 2: Confirm
      setCurrentStep(2);
      setError("");
      return;
    }

    if (pathType === "qr_payment" && currentStep === 0) {
      // Step 1: Simulate QR scan
      setQrScanned(true);
      setConfirmData({ amount, receiver, qrData: "QR_CODE_SCANNED" });
      setCurrentStep(1);
      setError("");
      return;
    }

    if (pathType === "qr_payment" && currentStep === 1) {
      // Step 2: Confirm
      setCurrentStep(2);
      setError("");
      return;
    }

    // Final submission
    task.logStep("submit_click");

    const pathTypeLog = pathType || "unknown";
    console.log(`PATH: ${pathTypeLog}`);

    logEvent({
      type: "transaction_submit",
      flowId: FLOW_ID,
      stepId: STEP_ID,
      amount: parseFloat(amount),
      receiver,
      hasNote: note.length > 0,
      pathType: pathTypeLog,
    });

    // Start transaction in metrics collector
    if (window.__metricsCollector) {
      const txnId = window.__metricsCollector.startTransaction();
      console.log("[TransactionPage] Transaction started:", txnId);
      console.log(`[TransactionPage] Path type: ${pathTypeLog}`);
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
        pathType: pathTypeLog,
      });

      // Reset form after 2 seconds
      setTimeout(() => {
        setAmount("");
        setReceiver("");
        setNote("");
        setIfscCode("");
        setUpiId("");
        setQrScanned(false);
        setShowAdvanced(false);
        setSuccess(false);
        setCurrentStep(0);
        setConfirmData(null);
      }, 2000);
    }, 1500);
  };

  // Determine step display
  const getStepDisplay = () => {
    if (!pathType) return "Loading...";
    
    if (pathType === "bank_transfer") {
      const steps = ["Account", "IFSC", "Confirm", "OTP", "Success"];
      return `${currentStep + 1}/${steps.length}`;
    } else if (pathType === "upi_payment") {
      const steps = ["UPI ID", "Confirm", "Success"];
      return `${currentStep + 1}/${steps.length}`;
    } else if (pathType === "qr_payment") {
      const steps = ["Scan QR", "Confirm", "Success"];
      return `${currentStep + 1}/${steps.length}`;
    }
    return "";
  };

  // Get button text based on path and step
  const getButtonText = () => {
    if (!pathType) return "Loading...";
    
    if (pathType === "bank_transfer") {
      if (currentStep === 0) return "Enter Account";
      if (currentStep === 1) return "Enter IFSC";
      if (currentStep === 2) return "Confirm Details";
      if (currentStep === 3) return "Verify OTP";
      return "Send Transaction";
    }
    
    if (pathType === "upi_payment") {
      if (currentStep === 0) return "Enter UPI ID";
      if (currentStep === 1) return "Confirm Payment";
      return "Send Transaction";
    }
    
    if (pathType === "qr_payment") {
      if (currentStep === 0) return "Scan QR Code";
      if (currentStep === 1) return "Confirm Payment";
      return "Send Transaction";
    }
    
    return "Send Transaction";
  };

  return (
    <div className="page">
      <div className="card">
        <AdaptiveHeading level={2}>Create Transaction</AdaptiveHeading>
        
        {/* Path Type Badge */}
        {pathType && (
          <div style={{
            padding: "8px 12px",
            marginBottom: "15px",
            backgroundColor: "#e8f4f8",
            border: "1px solid #b3dfe8",
            borderRadius: "4px",
            fontSize: "12px",
            color: "#0277bd",
            fontWeight: "bold"
          }}>
            💳 Path: {pathType.replace(/_/g, " ").toUpperCase()} | Step {getStepDisplay()}
          </div>
        )}

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

        {/* Amount Field - Always visible for first step */}
        {(pathType === "bank_transfer" && currentStep === 0) ||
         (pathType === "upi_payment" && currentStep === 0) ||
         (pathType === "qr_payment" && currentStep === 0) ? (
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
            disabled={loading || success || transactionActive}
          />
        ) : null}

        {/* Receiver Field - Always visible for first step */}
        {(pathType === "bank_transfer" && currentStep === 0) ||
         (pathType === "upi_payment" && currentStep === 0) ||
         (pathType === "qr_payment" && currentStep === 0) ? (
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
        ) : null}

        {/* BANK TRANSFER PATH - Step 1: IFSC Code */}
        {pathType === "bank_transfer" && currentStep === 1 && (
          <AdaptiveInput
            type="text"
            placeholder="IFSC Code (e.g., SBIN0001234)"
            value={ifscCode}
            onChange={(e) => setIfscCode(e.target.value)}
            disabled={loading || success || transactionActive}
          />
        )}

        {/* BANK TRANSFER PATH - Step 2: Confirm Details */}
        {pathType === "bank_transfer" && currentStep === 2 && confirmData && (
          <div style={{
            padding: "12px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            <div style={{ marginBottom: "8px" }}><strong>Amount:</strong> ₹{confirmData.amount}</div>
            <div style={{ marginBottom: "8px" }}><strong>Recipient:</strong> {confirmData.receiver}</div>
            <div><strong>IFSC:</strong> {ifscCode}</div>
          </div>
        )}

        {/* BANK TRANSFER PATH - Step 3: OTP Verification */}
        {pathType === "bank_transfer" && currentStep === 3 && (
          <AdaptiveInput
            type="text"
            placeholder="Enter OTP (any 4 digits)"
            maxLength="4"
            disabled={loading || success || transactionActive}
          />
        )}

        {/* UPI PAYMENT PATH - Step 0: UPI ID Input */}
        {pathType === "upi_payment" && currentStep === 0 && (
          <AdaptiveInput
            type="text"
            placeholder="UPI ID (e.g., user@bankname)"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            disabled={loading || success || transactionActive}
          />
        )}

        {/* UPI PAYMENT PATH - Step 1: Confirm */}
        {pathType === "upi_payment" && currentStep === 1 && confirmData && (
          <div style={{
            padding: "12px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            <div style={{ marginBottom: "8px" }}><strong>Amount:</strong> ₹{confirmData.amount}</div>
            <div style={{ marginBottom: "8px" }}><strong>Recipient:</strong> {confirmData.receiver}</div>
            <div><strong>UPI ID:</strong> {confirmData.upiId}</div>
          </div>
        )}

        {/* QR PAYMENT PATH - Step 0: QR Scan */}
        {pathType === "qr_payment" && currentStep === 0 && (
          <div style={{
            padding: "20px",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            textAlign: "center",
            marginBottom: "15px"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>📱</div>
            <AdaptiveParagraph>Click "Scan QR Code" to simulate QR scanning</AdaptiveParagraph>
          </div>
        )}

        {/* QR PAYMENT PATH - Step 1: Confirm after QR scan */}
        {pathType === "qr_payment" && currentStep === 1 && (
          <div style={{
            padding: "12px",
            backgroundColor: "#f5f5f5",
            borderRadius: "4px",
            marginBottom: "15px",
            fontSize: "14px"
          }}>
            <div style={{ marginBottom: "8px" }}><strong>Amount:</strong> ₹{confirmData.amount}</div>
            <div style={{ marginBottom: "8px" }}><strong>Recipient:</strong> {confirmData.receiver}</div>
            <div style={{ marginBottom: "8px", color: "#2196f3" }}>✓ QR Code Scanned</div>
          </div>
        )}

        {/* Advanced Options Toggle - Only show on initial step */}
        {((pathType === "bank_transfer" && currentStep === 0) ||
          (pathType === "upi_payment" && currentStep === 0) ||
          (pathType === "qr_payment" && currentStep === 0)) && (
          <AdaptiveButton
            onClick={toggleAdvanced}
            style={{
              background: "#f0f0f0",
              color: "#333",
              marginBottom: "10px",
              width: "100%",
              textAlign: "left",
            }}
            disabled={loading || success || transactionActive}
          >
            {showAdvanced ? "▼" : "▶"} Advanced Options
          </AdaptiveButton>
        )}

        {/* Advanced Options Section - Collapsible */}
        {showAdvanced && ((pathType === "bank_transfer" && currentStep === 0) ||
          (pathType === "upi_payment" && currentStep === 0) ||
          (pathType === "qr_payment" && currentStep === 0)) && (
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
              disabled={loading || success || transactionActive}
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
          {loading ? "Processing..." : success ? "Sent!" : getButtonText()}
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
          This is a demo transaction form using {pathType ? pathType.replace(/_/g, " ") : "a transaction"} path. No real transactions are processed.
        </AdaptiveParagraph>
      </div>
    </div>
  );
}
