# Page Flow & Navigation Structure

## Complete Application Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME PAGE (/)                            │
│  - Landing page with features overview                          │
│  - Navigation to all flows                                      │
│  - Call-to-action buttons                                       │
└──────────────┬────────────────────────────────────────────────┬──┘
               │                                                │
        ┌──────▼─────┐                                   ┌──────▼──────┐
        │   LOGIN     │                                   │  REGISTER   │
        │   PAGE      │                                   │   PAGE      │
        └──────┬─────┘                                   └──────┬──────┘
               │                                                │
          ┌────▼────┐                                     ┌─────▼────┐
          │Enter    │                                     │Enter    │
          │Username │                                     │Email    │
          └────┬────┘                                     └─────┬────┘
               │                                                │
          ┌────▼────┐                                     ┌─────▼────┐
          │Enter    │                                     │Set       │
          │Password │                                     │Password  │
          └────┬────┘                                     └─────┬────┘
               │                                                │
          ┌────▼──────────┐                             ┌───────▼─────┐
          │Authenticating │                             │Registering  │
          └────┬──────────┘                             └───────┬─────┘
               │                                                │
               │ Success                                        │ Success
               │                                                │
          ┌────▼────────────┐                             ┌─────▼──────┐
          │   DASHBOARD     │                             │   SUCCESS  │
          │   (Redirect)    │                             │  (Redirect │
          └─────────────────┘                             │  to Login) │
                                                          └────────────┘

┌──────────────────────────────────────────────────────────────┐
│            TRANSACTION PAGE (/transaction)                    │
├──────────────────────────────────────────────────────────────┤
│  Step 1: Select Service                                      │
│  ├─ Money Transfer 💸                                        │
│  ├─ Bill Payment 📄                                          │
│  ├─ Purchase 🛍️                                              │
│  └─ Subscription 📦                                          │
│                                                              │
│  Step 2: Review Transaction                                 │
│  ├─ Service Name                                            │
│  ├─ Amount                                                  │
│  ├─ Recipient Details (optional)                            │
│  └─ Status: Pending                                         │
│                                                              │
│  Step 3: Processing                                         │
│  └─ Loading animation                                       │
│                                                              │
│  Step 4: Success ✅                                          │
│  └─ Redirect to Dashboard                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│             RECOVERY PAGE (/recovery)                         │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Enter Email                                        │
│  └─ Email verification                                      │
│                      ▼                                      │
│  ┌──────────────────────────────────────┐                  │
│  │   Step 2: Select Recovery Method      │                  │
│  └──────────────┬──────────────┬────────┘                  │
│                 │              │                            │
│        ┌────────▼──────┐  ┌────▼─────────┐                │
│        │  QR CODE FLOW │  │ TAP YES FLOW │                │
│        └────────┬──────┘  └────┬─────────┘                │
│                 │              │                            │
│        ┌────────▼──────┐  ┌────▼─────────┐                │
│        │ QR Scan Step  │  │Waiting for   │                │
│        │ (Simulate)    │  │Approval      │                │
│        └────────┬──────┘  │(Simulate)    │                │
│                 │         └────┬─────────┘                │
│        ┌────────▼──────┐       │                          │
│        │ Verifying...  │◄──────┘                          │
│        └────────┬──────┘                                   │
│                 │                                          │
│        ┌────────▼─────────────┐                           │
│        │ Step 3: Reset Pass   │                           │
│        ├─ New Password        │                           │
│        └─ Confirm Password    │                           │
│                 │                                          │
│        ┌────────▼──────┐                                   │
│        │ Success ✅    │                                   │
│        │ (Redirect to  │                                   │
│        │  Login)       │                                   │
│        └───────────────┘                                   │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│            DASHBOARD PAGE (/dashboard)                        │
├──────────────────────────────────────────────────────────────┤
│  Tabs: [Overview] [Metrics] [Session]                         │
│                                                              │
│  Overview Tab:                                              │
│  ├─ Total Clicks          📊 Metrics Cards                 │
│  ├─ Session Duration      🎯 Real-time Updates             │
│  ├─ Mouse Distance        📍 Visual Display                │
│  ├─ Idle Time             ⏱️ Analytics                      │
│  ├─ Velocity Mean         🚀 Performance                    │
│  ├─ Misclicks             ❌ Error Tracking                 │
│  ├─ Scroll Depth          📜 Engagement                     │
│  └─ Actions               ✋ User Behavior                  │
│                                                              │
│  Metrics Tab:                                               │
│  ├─ Mouse Velocity (Mean & Max)                            │
│  ├─ Total Distance Traveled                                │
│  ├─ Total Actions & Clicks                                 │
│  └─ Misclicks Count                                        │
│                                                              │
│  Session Tab:                                               │
│  ├─ Session Duration                                       │
│  ├─ Idle Time                                              │
│  ├─ Active Time (calculated)                               │
│  └─ Page Scroll Depth %                                    │
│                                                              │
│  Action Buttons:                                            │
│  ├─ Go to Login 🔐                                         │
│  ├─ New Transaction 💳                                     │
│  └─ Back to Home 🏠                                        │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                    GLOBAL HEADER                              │
├──────────────────────────────────────────────────────────────┤
│  Sticky Navigation Bar                                       │
│  ├─ Logo & Title                                           │
│  ├─ Nav Links: Home | Login | Register | Transaction |     │
│  │             Recovery | Dashboard                         │
│  └─ Real-time Metrics Display (4 key metrics)              │
│     ├─ Duration (seconds)                                  │
│     ├─ Distance (pixels)                                   │
│     ├─ Clicks (count)                                      │
│     └─ Idle Time (seconds)                                 │
└──────────────────────────────────────────────────────────────┘
```

## Navigation Paths

### From Home Page:

- `Home` → Get Started → `Login`
- `Home` → View Dashboard → `Dashboard`
- `Home` → Feature Cards → Navigate to any page

### From Login Page:

- `Login` → Don't have account? → `Register`
- `Login` → Forgot password? → `Recovery`
- `Login` → Successful → `Dashboard`

### From Register Page:

- `Register` → Back → `Register` (previous step)
- `Register` → Have account? → `Login`
- `Register` → Successful → `Login`

### From Transaction Page:

- `Transaction` → Select Service → `Transaction` (next step)
- `Transaction` → Back → `Transaction` (previous step)
- `Transaction` → Cancel → `Dashboard`
- `Transaction` → Successful → `Dashboard`

### From Recovery Page:

- `Recovery` → Back → `Recovery` (previous step)
- `Recovery` → Method Selection → `Recovery` (QR or Tap Yes)
- `Recovery` → QR Verification → Password Reset
- `Recovery` → Tap Yes Approval → Password Reset
- `Recovery` → Successful → `Login`

### From Dashboard Page:

- `Dashboard` → Go to Login → `Login`
- `Dashboard` → New Transaction → `Transaction`
- `Dashboard` → Back to Home → `Home`
- `Dashboard` → Tab Navigation → `Dashboard` (different tab)

## Metrics Collection Points

### Home Page

- Page view event logged
- Global metrics tracked (mouse, idle, scroll)

### Login Page

- `step_enter` event on each step
- `login_attempt` event on submit
- Form interaction tracked

### Register Page

- `step_enter` event on each step
- `registration_attempt` event on submit
- Form validation and interaction tracked

### Transaction Page

- `step_enter` event on each step
- `service_selected` event when choosing service
- `payment_attempt` event on confirmation
- Service and amount tracking

### Recovery Page

- `step_enter` event on each step
- `recovery_email_submitted` event
- `recovery_method_selected` event (QR or Tap Yes)
- `qr_scanned` event (QR flow)
- `approval_confirmed` event (Tap Yes flow)
- `password_reset_success` event on completion

### Dashboard Page

- Page view event logged
- Tab navigation tracked
- All metrics displayed in real-time
- Global metrics updated continuously

## Responsive Design

All pages are optimized for:

- Mobile (< 640px)
- Tablet (640px - 1024px)
- Desktop (> 1024px)

Layout adjustments:

- 1-column on mobile
- 2-column on tablet
- Multi-column on desktop
- Flexible spacing and typography

## Loading & Success States

### Authentication Flow

- Loading spinner during authentication
- Success page with redirect timer

### Payment Flow

- Loading spinner during processing (2s simulated)
- Success confirmation with redirect

### Registration Flow

- Loading spinner during account creation
- Success checkmark with redirect

### Recovery Flow

- QR verification loading state
- Tap Yes waiting state with simulation notice
- Password reset confirmation

## UI Variant Application

All UI elements respond to persona detection:

**Buttons:**

- Novice/Elderly: Larger (Level 4: `px-8 py-5 text-2xl`)
- Intermediate: Medium (Level 1: `px-4 py-2 text-base`)
- Expert: Compact (Level 0: `px-3 py-1 text-sm`)

**Input Fields:**

- Same 5-level progression as buttons
- Ensures target sizes are appropriate for user type

**Text:**

- Adaptive font sizes
- Dynamic font weights
- Responsive spacing

**Spacing:**

- 4 levels of spacing adjustment
- Layout responds to user comfort level
