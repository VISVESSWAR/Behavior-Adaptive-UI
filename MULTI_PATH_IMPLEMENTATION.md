# Multi-Path Transaction System Implementation

## Overview
Extended the transaction system to support multiple task paths for experimental evaluation of an Adaptive UI RL system. Implementation allows random assignment of one of three transaction paths, each with different complexity levels but leading to the same success outcome.

---

## Implementation Details

### PART 1: Path Types Definition

**File:** `src/pages/TransactionPage.jsx`

```javascript
const TRANSACTION_PATHS = [
  "bank_transfer",
  "upi_payment",
  "qr_payment"
];
```

### PART 2: Path Assignment & Storage

**On Component Mount:**
- Random path selected from TRANSACTION_PATHS
- Stored in component state: `const [pathType, setPathType] = useState(null)`
- Persists for entire transaction session
- Falls back to using metrics collector's pathType if already assigned

```javascript
// Get pathType from metrics collector if available, otherwise assign random one
let assignedPathType = null;
if (window.__metricsCollector?.pathType) {
  assignedPathType = window.__metricsCollector.pathType;
} else {
  assignedPathType = TRANSACTION_PATHS[Math.floor(Math.random() * TRANSACTION_PATHS.length)];
}
setPathType(assignedPathType);
console.log("TRANSACTION PATH:", assignedPathType);
```

### PART 3: Path Structure

#### Bank Transfer (5 Steps)
1. **Step 0:** Enter Account Number + Select Recipient
2. **Step 1:** Enter IFSC Code
3. **Step 2:** Confirm Details
4. **Step 3:** OTP Verification
5. **Step 4:** Success

#### UPI Payment (3 Steps)
1. **Step 0:** Enter UPI ID + Select Recipient
2. **Step 1:** Confirm Payment
3. **Step 2:** Success

#### QR Payment (3 Steps)
1. **Step 0:** Scan QR Code (simulated) + Select Recipient
2. **Step 1:** Confirm Payment
3. **Step 2:** Success

**Path-Specific State Variables:**
```javascript
const [currentStep, setCurrentStep] = useState(0);
const [ifscCode, setIfscCode] = useState("");        // bank_transfer only
const [upiId, setUpiId] = useState("");              // upi_payment only
const [qrScanned, setQrScanned] = useState(false);   // qr_payment only
const [confirmData, setConfirmData] = useState(null);
```

### PART 4: Logging & Event Tracking

**logging/eventLogger.jsx:** All transaction events include pathType

**transactionPage Events:**
- `page_view`: Initial page load (includes pathType context)
- `transaction_submit`: When transaction flow begins (includes **pathType**)
- `transaction_success`: When transaction completes (includes **pathType**)

**RewardLogic:**
- ✓ No changes to reward calculation
- ✓ Same RL state vector
- ✓ Only navigation flow differs by path

**metrics Collector RL Logging:**
- pathType automatically included in all RL snapshots
- Used for path-wise performance comparison in evaluation
- CSV format: `timestamp,persona,pathType,modelAction,finalAction,source,reward,taskTime,success`

### PART 5: UI Components

**Path Badge Display:**
Shows current path and progress:
```
💳 Path: BANK TRANSFER | Step 1/5
💳 Path: UPI PAYMENT | Step 1/3
💳 Path: QR PAYMENT | Step 1/3
```

**Dynamic Button Text:**
```javascript
getButtonText() // Returns path + step specific text
```

Examples:
- Bank Transfer: "Enter Account" → "Enter IFSC" → "Confirm Details" → "Verify OTP" → "Send Transaction"
- UPI Payment: "Enter UPI ID" → "Confirm Payment" → "Send Transaction"
- QR Payment: "Scan QR Code" → "Confirm Payment" → "Send Transaction"

**Conditional Form Fields:**
- Amount & Recipient: Shown on Step 0 only for all paths
- IFSC Code: Shown on bank_transfer Step 1
- UPI ID: Shown on upi_payment Step 0
- QR Scan UI: Shown on qr_payment Step 0
- Confirm Details: Shown before final submission

### PART 6: Debug Output

Console logging for verification:
```javascript
console.log("TRANSACTION PATH:", pathType);
console.log(`PATH: ${pathType}`);
```

---

## Constraints Met

✓ **pathType remains constant during session** - assigned once on mount, never changes  
✓ **Must not reset mid-transaction** - persists across all steps  
✓ **Logging non-blocking** - async event logging, no UI delay  
✓ **All paths call same success handler** - `completeTransactionUser()` and `completeTransactionAuto()`  
✓ **Reward logic unchanged** - `calculateTaskReward()` identical across paths  
✓ **RL state vector unchanged** - all paths use same metrics collection  

---

## Expected Behavior

### Session Flow

1. **User navigates to TransactionPage**
   - Random path assigned (or uses metrics collector's pathType)
   - Path badge displays current path and step progress
   - Debug output: `TRANSACTION PATH: [bank_transfer|upi_payment|qr_payment]`

2. **User completes transaction**
   - UI guides through path-specific steps
   - Each step logged with correct pathType
   - All interactions tracked with path context

3. **Transaction completes (auto or manual)**
   - Success event logged with pathType
   - Metrics collector includes pathType in RL snapshot
   - Form resets for next session

4. **Data collection**
   - CSV exports include pathType column
   - Path-wise performance comparison enabled in evaluation
   - RL transitions tagged with transaction path used

---

## Files Modified

- `src/pages/TransactionPage.jsx` - Main implementation
  - Added TRANSACTION_PATHS constant
  - Added pathType state and path-specific state variables
  - Implemented path-aware handleSubmit with step progression
  - Added path-specific UI rendering with conditional components
  - Added getStepDisplay() and getButtonText() helpers
  - Added pathType to logging: transaction_submit and transaction_success events
  - Added debug console.log("TRANSACTION PATH:", pathType)

---

## Integration Points

### With MetricsCollector (metricsCollectorSimplified.jsx)
- Reads: `window.__metricsCollector?.pathType` if available
- Falls back to: Local random assignment
- Ensures: Consistent pathType for RL logging

### With Event Logger (eventLogger.jsx)
- All transaction events include pathType
- No changes required - already supports custom event fields

### With RL Logger (rlLogger.jsx)
- pathType already integrated in snapshot collection
- CSV header includes pathType column
- No changes required

---

## Testing Checklist

- [ ] Load TransactionPage - verify path badge appears
- [ ] Check console logs - should see `TRANSACTION PATH: [path_type]`
- [ ] Complete bank_transfer path - verify all 5 steps appear
- [ ] Complete upi_payment path - verify 3 steps appear
- [ ] Complete qr_payment path - verify 3 steps appear
- [ ] Check localStorage logs - verify pathType in transaction_submit/success events
- [ ] Export CSV - verify pathType column present
- [ ] Reload page - verify new random path assigned (different from previous)
- [ ] Verify path doesn't change during transaction - stays constant through all steps

---

## Example Log Entries

### Event Logger (localStorage)
```json
{
  "ts": 1704067200000,
  "type": "transaction_submit",
  "flowId": "transaction",
  "stepId": "create",
  "amount": 1000,
  "receiver": "user@example.com",
  "hasNote": false,
  "pathType": "bank_transfer"
}

{
  "ts": 1704067201500,
  "type": "transaction_success",
  "flowId": "transaction",
  "stepId": "create",
  "amount": 1000,
  "receiver": "user@example.com",
  "pathType": "bank_transfer"
}
```

### RL Logger (CSV Format)
```
timestamp,persona,pathType,modelAction,finalAction,source,reward,taskTime,success
2024-01-01T12:00:00Z,novice,bank_transfer,2,2,guided,0.45,12000,1
2024-01-01T12:00:10Z,novice,bank_transfer,3,3,guided,0.40,22000,1
```

---

## Reward Logic (Unchanged)

```javascript
calculateTaskReward(taskData) {
  let reward = 0;
  if (taskData.completed) reward += 0.5;    // Completion bonus
  if (taskData.failed) reward -= 0.3;       // Timeout penalty
  reward -= 0.01 * pathLength;              // Path length penalty (path-agnostic)
  return reward;
}
```

All three paths use identical reward calculation - only navigation differs.
