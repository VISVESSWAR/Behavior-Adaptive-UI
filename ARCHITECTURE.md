# Visual Architecture Overview

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        BROWSER APPLICATION                              │
│                          (React 19 + Tailwind)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   ┌──────────────────────────────────────────────────────────────────┐  │
│   │                      APP WRAPPER (App.js)                        │  │
│   │  ├─ UIProvider (Context for UI Variants)                        │  │
│   │  ├─ BrowserRouter (React Router)                                │  │
│   │  └─ Header with Global Navigation & Metrics                    │  │
│   └──────────────────────────────────────────────────────────────────┘  │
│          │                                                               │
│          └─ Routes (React Router)                                        │
│             ├─ / → Home Page                                            │
│             ├─ /login → Login Page                                      │
│             ├─ /register → Register Page                                │
│             ├─ /transaction → Transaction Page                          │
│             ├─ /recovery → Recovery Page                                │
│             └─ /dashboard → Dashboard Page                              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                   METRICS COLLECTION SYSTEM                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Each Page Uses 3 Custom Hooks (Automatic Tracking)                │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  useMouseTracker("flowId", "stepId")                             │ │
│  │  ├─ Tracks mouse position (100ms interval)                       │ │
│  │  ├─ Calculates velocity (pixels/ms)                              │ │
│  │  ├─ Measures distance traveled                                   │ │
│  │  ├─ Counts clicks                                                │ │
│  │  ├─ Detects misclicks                                            │ │
│  │  └─ Logs to localStorage                                         │ │
│  │                                                                    │ │
│  │  useIdleTimer("flowId", "stepId")                                │ │
│  │  ├─ Monitors inactivity                                          │ │
│  │  ├─ Resets on user interaction                                   │ │
│  │  ├─ Returns idle time in seconds                                 │ │
│  │  └─ Used for engagement analysis                                 │ │
│  │                                                                    │ │
│  │  useScrollDepth("flowId", "stepId")                              │ │
│  │  ├─ Tracks scroll position                                       │ │
│  │  ├─ Calculates percentage (0-1)                                  │ │
│  │  ├─ Updates on scroll events                                     │ │
│  │  └─ Measures page engagement                                     │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐ │
│  │ Custom Event Logging (Manual Events)                              │ │
│  ├────────────────────────────────────────────────────────────────────┤ │
│  │                                                                    │ │
│  │  logEvent({                                                      │ │
│  │    type: "event_type",                                           │ │
│  │    flowId: "flow_name",                                          │ │
│  │    stepId: "step_name",                                          │ │
│  │    ...customData                                                 │ │
│  │  })                                                              │ │
│  │                                                                    │ │
│  │  Stored in localStorage: "behavior_logs"                         │ │
│  │  Format: JSON array of events                                    │ │
│  │                                                                    │ │
│  └────────────────────────────────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      UI ADAPTATION SYSTEM                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  UIContext (React Context)                                             │
│  ├─ Stores: uiConfig, setActionId                                     │
│  └─ Provides to all child components                                   │
│                                                                          │
│  ↓                                                                       │
│                                                                          │
│  useUIVariants() Hook                                                  │
│  ├─ Gets uiConfig from UIContext                                      │
│  ├─ Applies variant mappings:                                         │
│  │  ├─ BUTTON_SIZES (5 levels)                                        │
│  │  ├─ INPUT_SIZES (5 levels)                                         │
│  │  ├─ TEXT_SIZES (5 levels)                                          │
│  │  ├─ FONT_WEIGHTS (3 levels)                                        │
│  │  └─ SPACING_LEVELS (4 levels)                                      │
│  └─ Returns UI classes                                                │
│                                                                          │
│  ↓                                                                       │
│                                                                          │
│  Adaptive Components                                                   │
│  ├─ AdaptiveButton                                                     │
│  │  ├─ Uses ui.button classes                                         │
│  │  └─ Dynamic size based on persona                                  │
│  │                                                                      │
│  └─ AdaptiveInput                                                      │
│     ├─ Uses ui.input classes                                          │
│     └─ Dynamic size for accessibility                                 │
│                                                                          │
│  ↓                                                                       │
│                                                                          │
│  Rendered UI Elements                                                  │
│  └─ Buttons & inputs scale from xs to 2xl                             │
│     based on detected user persona                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPONENT HIERARCHY                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  App.js (Router + Header)                                              │
│  │                                                                       │
│  ├─ Header Component                                                    │
│  │  └─ Navigation + Metrics Display                                    │
│  │                                                                       │
│  └─ Routes                                                              │
│     ├─ Home.js                                                          │
│     │  └─ Hero + Features + Flows + CTA                               │
│     │                                                                    │
│     ├─ Login.js                                                         │
│     │  ├─ AdaptiveInput (username)                                     │
│     │  ├─ AdaptiveInput (password)                                     │
│     │  └─ AdaptiveButton (login)                                       │
│     │                                                                    │
│     ├─ Register.js                                                      │
│     │  ├─ AdaptiveInput (email)                                        │
│     │  ├─ AdaptiveInput (password)                                     │
│     │  ├─ AdaptiveInput (confirm)                                      │
│     │  └─ AdaptiveButton (register)                                    │
│     │                                                                    │
│     ├─ Transaction.js                                                   │
│     │  ├─ Service Grid (4 cards)                                       │
│     │  ├─ Transaction Review                                           │
│     │  ├─ AdaptiveInput (recipient)                                    │
│     │  └─ AdaptiveButton (pay)                                         │
│     │                                                                    │
│     ├─ Recovery.js                                                      │
│     │  ├─ Email Step                                                    │
│     │  ├─ Method Selection (QR / Tap Yes)                             │
│     │  ├─ QR Flow (scan simulation)                                    │
│     │  ├─ Tap Yes Flow (approval simulation)                           │
│     │  ├─ Password Reset                                               │
│     │  └─ Success Confirmation                                         │
│     │                                                                    │
│     └─ Dashboard.js                                                     │
│        ├─ Tab Navigation                                               │
│        ├─ Overview Tab (8 metrics)                                     │
│        ├─ Metrics Tab (detailed)                                       │
│        ├─ Session Tab (time analysis)                                  │
│        └─ Action Buttons                                               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                   DATA FLOW DIAGRAM                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  User Interaction (click, move, type)                                   │
│         ↓                                                                │
│  Browser Events                                                         │
│         ↓                                                                │
│  Custom Hooks (Track Metrics)                                           │
│  ├─ useMouseTracker → s_num_clicks, s_total_distance, etc             │
│  ├─ useIdleTimer → idle_time                                           │
│  └─ useScrollDepth → scroll_depth                                      │
│         ↓                                                                │
│  Component State & localStorage                                         │
│         ↓                                                                │
│  logEvent() or Header Metrics Component                                │
│         ↓                                                                │
│  localStorage ("behavior_logs")                                         │
│         ↓                                                                │
│  Dashboard/DevTools Inspection                                         │
│  └─ View & Analyze Metrics                                             │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                   STYLING SYSTEM (Tailwind CSS)                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Global Styles (index.css)                                              │
│  ├─ @tailwind base                                                      │
│  ├─ @tailwind components (.btn-base, .input-base, .card-base)         │
│  └─ @tailwind utilities (all Tailwind utilities)                       │
│         ↓                                                                │
│  Component Classes                                                      │
│  ├─ Cards: card-base, text-gray-900, shadow-md, etc                    │
│  ├─ Buttons: btn-base, bg-blue-600, hover:bg-blue-700, etc            │
│  ├─ Inputs: input-base, border, focus:ring-2, etc                      │
│  ├─ Layouts: grid, flex, flex-col, gap-*, etc                         │
│  └─ Responsive: sm:, md:, lg: prefixes                                 │
│         ↓                                                                │
│  Dynamic Classes (from useUIVariants)                                   │
│  ├─ Button sizing: px-3 py-1 to px-8 py-5                             │
│  ├─ Input sizing: same scale as buttons                                │
│  ├─ Text sizes: text-sm to text-2xl                                    │
│  ├─ Font weights: font-normal to font-bold                             │
│  └─ Spacing: gap-2 to gap-6                                            │
│         ↓                                                                │
│  Rendered HTML Elements                                                 │
│  └─ Beautiful, responsive UI                                           │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                    PAGE STATE MANAGEMENT                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Local State (useState)                                                 │
│  ├─ Login: stepId, username, password, error                           │
│  ├─ Register: stepId, email, password, confirmPassword, error          │
│  ├─ Transaction: stepId, selectedService, amount                       │
│  ├─ Recovery: stepId, email, recoveryMethod, verified                  │
│  └─ Dashboard: stepId, activeTab                                       │
│         ↓                                                                │
│  Updates on User Interaction                                            │
│  ├─ Form input → setState                                              │
│  ├─ Button click → setState (next step)                                │
│  └─ Tab click → setState (active tab)                                  │
│         ↓                                                                │
│ Effects (useEffect)                                                     │
│  ├─ On stepId change → logEvent                                        │
│  ├─ On mount → logEvent (page_view)                                    │
│  └─ Initialize metrics hooks                                           │
│         ↓                                                                │
│  Conditional Rendering                                                 │
│  └─ Show/hide content based on stepId                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Typical User Journey

```
1. LANDING
   └─ User opens app → Sees Home Page
      └─ metrics: Page view logged
         Scrolls through features
         └─ metrics: Scroll depth tracked

2. SIGN UP FLOW
   └─ Clicks "Create Account" → Register Page
      ├─ Enters email
      ├─ Enters password
      ├─ Confirms password
      └─ Clicks "Register"
         └─ metrics: Form input, clicks, hesitation logged
         Processing animation (1.5s)
         Redirected to Login

3. LOGIN FLOW
   └─ Enters username
      ├─ Enters password
      └─ Clicks "Login"
         └─ metrics: Login attempt logged
         Loading animation (1.5s)
         Redirected to Dashboard

4. VIEW DASHBOARD
   └─ Dashboard Page loads
      ├─ Sees 8 real-time metrics
      ├─ Clicks "Metrics" tab
      ├─ Clicks "Session" tab
      └─ Clicks "New Transaction"
         └─ metrics: Tab navigation logged

5. TRANSACTION FLOW
   └─ Transaction Page
      ├─ Clicks service (e.g., Money Transfer)
      ├─ Reviews transaction
      ├─ Enters recipient
      └─ Clicks "Confirm Payment"
         └─ metrics: Service selected, payment attempt logged
         Processing animation (2s)
         Redirected to Dashboard

6. RECOVERY FLOW (If Password Forgotten)
   └─ Recovery Page
      ├─ Enters email
      └─ Chooses method:
         ├─ QR CODE FLOW:
         │  ├─ Sees QR visualization
         │  ├─ Clicks "Simulate Scan"
         │  └─ metrics: QR scanned logged
         │
         └─ TAP YES FLOW:
            ├─ Sees "Waiting for Approval"
            ├─ Clicks "Simulate Approval"
            └─ metrics: Approval confirmed logged
         
         Password Reset Step
         ├─ Enters new password
         ├─ Confirms password
         └─ Clicks "Reset Password"
            └─ metrics: Password reset success logged
         
         Redirected to Login

7. CONTINUOUS TRACKING
   └─ Throughout entire session:
      ├─ Mouse: Position, velocity, distance, clicks
      ├─ Time: Session duration, idle time
      ├─ Page: Scroll depth, engagement
      └─ Events: All custom actions logged
         ↓
      All data stored in localStorage
         ↓
      Visible in header metrics & dashboard
         ↓
      Can be analyzed for persona classification
```

## Metrics Display Locations

```
Location 1: HEADER (Always Visible)
┌────────────────────────────────────────────────────┐
│  Duration: 125.5s │ Distance: 3,456px │           │
│  Clicks: 24       │ Idle: 15.2s                    │
└────────────────────────────────────────────────────┘

Location 2: DASHBOARD - OVERVIEW TAB
┌────────────────────────────────────────────────────┐
│ Total Clicks    │ Session Dur.    │ Mouse Dist.    │
│      24         │   125.5s        │   3,456px      │
├─────────────────┼─────────────────┼────────────────┤
│ Idle Time       │ Velocity Mean   │ Misclicks      │
│   15.2s         │  4.23 px/ms     │      2         │
├─────────────────┼─────────────────┼────────────────┤
│ Scroll Depth    │ Total Actions   │                │
│    67.5%        │       48        │                │
└────────────────────────────────────────────────────┘

Location 3: DASHBOARD - METRICS TAB
├─ Mouse Velocity (Mean): 4.23 px/ms
├─ Mouse Velocity (Max): 12.56 px/ms
├─ Total Distance: 3,456 px
├─ Total Actions: 48
├─ Total Clicks: 24
└─ Misclicks: 2

Location 4: DASHBOARD - SESSION TAB
├─ Session Duration: 125.5s
├─ Idle Time: 15.2s
├─ Active Time: 110.3s
└─ Scroll Depth: 67.5%

Location 5: LOCALSTORAGE
JSON array of all events with timestamps
Queryable via browser DevTools
```

---

This architecture ensures comprehensive behavior tracking while maintaining clean, responsive UI that adapts to user needs!
