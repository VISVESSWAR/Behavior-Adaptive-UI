# Quick Start Guide

## Installation

### 1. Install Node Modules

```bash
npm install
```

### 2. Install Tailwind CSS (if not auto-installed)

```bash
npm install -D tailwindcss postcss autoprefixer
```

### 3. Start Development Server

```bash
npm start
```

The application will open at `http://localhost:3000`

## First Time Setup

### What You'll See:

1. **Home Page** - Landing page with features and navigation
2. **Sticky Header** - Real-time metrics visible on all pages
3. **5 Main Flows** - Login, Register, Transaction, Recovery, Dashboard

## Testing the Flows

### 1. Login Flow (3 minutes)

```
1. Click "Get Started" on home page
2. Enter any username → Click "Continue"
3. Enter any password → Click "Login"
4. Watch the loading spinner
5. Auto-redirect to Dashboard
✓ Check header metrics updated
```

### 2. Register Flow (3 minutes)

```
1. Go to Register page from Home or Login
2. Enter email address → Click "Continue"
3. Enter password (6+ characters) → Click "Next"
4. Confirm password → Click "Register"
5. Watch account creation animation
6. Auto-redirect to Login page
✓ Check metrics tracked for each step
```

### 3. Transaction Flow (2 minutes)

```
1. Go to Transaction page
2. Click on any service card (e.g., Money Transfer 💸)
3. Review the transaction details
4. (Optional) Enter recipient details
5. Click "Confirm Payment"
6. Watch processing animation
7. Auto-redirect to Dashboard
✓ Check service selection tracked in logs
```

### 4. Recovery - QR Code Flow (3 minutes)

```
1. Go to Recovery page
2. Enter your email → Click "Find Account"
3. Click "Use QR Code" button
4. You'll see a QR code placeholder
5. Click "Simulate QR Scan"
6. Wait for verification (2 seconds)
7. Set new password → Click "Reset Password"
8. Auto-redirect to Login
✓ Check both QR flow events logged
```

### 5. Recovery - Tap Yes Flow (3 minutes)

```
1. Go to Recovery page
2. Enter your email → Click "Find Account"
3. Click "Use Tap Yes" button
4. You'll see "Waiting for Approval"
5. Click "Simulate 'Tap Yes' Approval"
6. Wait for verification
7. Set new password → Click "Reset Password"
8. Auto-redirect to Login
✓ Check Tap Yes flow events logged
```

### 6. Dashboard & Metrics (2 minutes)

```
1. Go to Dashboard page (or navigate from successful flows)
2. View "Overview" tab showing 8 metrics
3. Click "Metrics" tab for detailed stats
4. Click "Session" tab for session info
5. Navigate between tabs
6. Check that metrics update in real-time
✓ All metrics should be live and updating
```

## Key Features to Explore

### Adaptive Styling

- All buttons and inputs adapt their size
- Cards have hover effects
- Text is responsive
- Spacing adjusts for different users

### Navigation

- Click any page link in header to navigate
- Back buttons work on multi-step flows
- Links between related pages (e.g., Login → Register)
- Dashboard has quick action buttons

### Metrics Collection

- Header shows 4 key metrics
- Dashboard shows 8 comprehensive metrics
- Scroll down pages to see scroll tracking
- Move mouse around to see distance tracking

### Real-time Feedback

- Loading spinners on async operations
- Success messages with emojis
- Error messages on validation failure
- Tab highlighting on Dashboard

## File Structure Explanation

```
src/
├── App.js                    ← Main app with routing & header
├── index.js                  ← Entry point (wraps with UIProvider)
├── index.css                 ← Tailwind styles
│
├── pages/                    ← Page components
│   ├── Home.js              ← Landing page (/)
│   ├── Login.js             ← Authentication (/login)
│   ├── Register.js          ← Account creation (/register)
│   ├── Transaction.js       ← Payment/booking (/transaction)
│   ├── Recovery.js          ← Account recovery (/recovery)
│   └── Dashboard.js         ← Analytics (/dashboard)
│
├── components/              ← Reusable components
│   ├── AdaptiveButton.js    ← Dynamic button
│   └── AdaptiveInput.js     ← Dynamic input
│
├── hooks/                   ← Custom React hooks
│   ├── useMouseTracker.js   ← Mouse metrics
│   ├── useIdleTimer.js      ← Idle time
│   └── useScrollDepth.js    ← Scroll tracking
│
├── adaptation/              ← UI adaptation system
│   ├── UIContext.js         ← Context provider
│   ├── useUIVariants.js     ← Hook for UI styles
│   ├── uiVariants.js        ← Variant definitions
│   ├── uiSchema.js          ← Schema definitions
│   ├── actionSpace.js       ← Action definitions
│   └── applyAction.js       ← Apply actions
│
└── logging/                 ← Event logging
    └── eventLogger.js       ← Log storage

Configuration:
├── tailwind.config.js       ← Tailwind customization
├── postcss.config.js        ← PostCSS config
└── package.json             ← Dependencies
```

## Common Tasks

### View Collected Metrics

```javascript
// Open browser DevTools (F12)
// Go to Application → Local Storage → http://localhost:3000
// Look for "behavior_logs" key
// Or use console:

const logs = JSON.parse(localStorage.getItem("behavior_logs") || "[]");
console.table(logs);
```

### Clear Metrics

```javascript
// In browser DevTools console:
localStorage.removeItem("behavior_logs");
// Or use the app's internal function:
import { clearLogs } from "./logging/eventLogger";
clearLogs();
```

### Test Different Scenarios

- **Fast interactions** - Click quickly to simulate expert user
- **Slow interactions** - Wait between steps to simulate novice user
- **Scroll testing** - Go to pages with long content
- **Form validation** - Try entering invalid data

### Add Custom Events

```javascript
import { logEvent } from "./logging/eventLogger";

// Log a custom event
logEvent({
  type: "custom_event_name",
  flowId: "your_flow",
  stepId: "your_step",
  customProperty: "value",
});
```

## Troubleshooting

### App Won't Start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Styles Not Applying

```bash
# Ensure Tailwind CSS is properly installed
npm install -D tailwindcss postcss autoprefixer

# Check tailwind.config.js exists
ls tailwind.config.js

# Restart development server
npm start
```

### Metrics Not Showing

- Open browser DevTools
- Check Application → Local Storage
- Verify "behavior_logs" exists
- Try navigating between pages
- Interact with forms (type, click)

### Routes Not Working

- Check that react-router-dom is installed
- Verify all page imports in App.js
- Check browser console for errors
- Ensure you're using correct paths (/login, /register, etc)

## Browser Compatibility

Tested and working on:

- Chrome/Chromium (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

Requirements:

- ES6 support
- localStorage support
- CSS Grid/Flexbox support

## Next Steps

1. **Explore the Code**

   - Read IMPLEMENTATION_GUIDE.md for detailed info
   - Check PAGE_FLOWS.md for flow diagrams
   - Review METRICS_ARCHITECTURE.md for metrics details

2. **Customize**

   - Modify colors in tailwind.config.js
   - Add new pages by creating in src/pages/
   - Extend metrics collection in hooks/

3. **Deploy**

   - Run `npm run build` for production
   - Upload `build/` folder to hosting
   - Set up backend for real authentication

4. **Integrate Backend**
   - Connect login to real authentication API
   - Save metrics to database
   - Implement real payment processing
   - Add user accounts and sessions

## Support Resources

### Documentation Files

- **IMPLEMENTATION_GUIDE.md** - Complete implementation details
- **PAGE_FLOWS.md** - Flow diagrams and navigation
- **METRICS_ARCHITECTURE.md** - Metrics collection details

### Code Comments

- Each file has descriptive comments
- Hooks have usage examples
- Pages show multi-step flow structure

### React/Tailwind Resources

- [React Documentation](https://react.dev)
- [React Router Docs](https://reactrouter.com)
- [Tailwind CSS Docs](https://tailwindcss.com)

## Tips for Best Experience

1. **Use Chrome DevTools** to monitor events
2. **Check metrics in Dashboard** after each action
3. **Test multiple flows** to see different patterns
4. **Interact naturally** (don't be too fast or slow)
5. **Try mobile view** to test responsive design

## Performance Notes

- The app is lightweight (~50KB gzipped)
- Metrics tracking is optimized (100ms intervals)
- localStorage limit is ~5MB (plenty of space)
- No backend required for basic functionality
- Works completely offline

Enjoy exploring the Adaptive UI System! 🚀
