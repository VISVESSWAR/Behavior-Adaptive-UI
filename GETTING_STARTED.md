# Getting Started - Commands

## First Time Setup

### Step 1: Install Dependencies

```bash
cd /path/to/copyforzip
npm install
```

This installs all required packages including:

- React 19
- React Router 7
- Tailwind CSS 3
- PostCSS
- Autoprefixer

### Step 2: Start Development Server

```bash
npm start
```

The app will:

- Open automatically in your browser
- Go to `http://localhost:3000`
- Show hot reload on file changes
- Display any errors in console

### Step 3: Done! 🎉

The app is now running. Proceed to **Testing Guide** below.

---

## Testing Guide

### Test 1: Navigate Home Page (1 minute)

```
1. You should see the landing page
2. View all 6 features
3. See all 5 available flows
4. Click any navigation link
5. Check header metrics update
```

### Test 2: Complete Login Flow (2 minutes)

```
1. Click "Get Started" button
2. Enter any username → Next
3. Enter any password → Login
4. Wait for loading spinner
5. Should redirect to Dashboard
6. Check header shows updated metrics
```

### Test 3: Complete Register Flow (3 minutes)

```
1. Go to Register page
2. Enter email address → Next
3. Enter password (8+ characters)
4. Confirm password → Register
5. Watch registration animation
6. Should redirect to Login
7. Try logging in with registered email
```

### Test 4: Complete Transaction Flow (2 minutes)

```
1. Go to Transaction page
2. Click on a service (e.g., Money Transfer 💸)
3. Review transaction details
4. (Optional) Enter recipient details
5. Click "Confirm Payment"
6. Watch processing animation (2 seconds)
7. Should redirect to Dashboard
8. Check service selection was logged
```

### Test 5: Test Recovery - QR Flow (3 minutes)

```
1. Go to Recovery page
2. Enter your email → Find Account
3. Click "Use QR Code" button
4. See QR visualization
5. Click "Simulate QR Scan"
6. Wait for verification (2 seconds)
7. Set new password
8. Click "Reset Password"
9. Should redirect to Login
10. Check QR events in localStorage
```

### Test 6: Test Recovery - Tap Yes Flow (3 minutes)

```
1. Go to Recovery page
2. Enter email address → Find Account
3. Click "Use Tap Yes" button
4. See "Waiting for Approval" message
5. Click "Simulate 'Tap Yes' Approval"
6. Wait for verification
7. Set new password
8. Click "Reset Password"
9. Should redirect to Login
10. Check Tap Yes events logged
```

### Test 7: Check Dashboard (2 minutes)

```
1. Go to Dashboard page
2. View Overview tab (8 metrics)
3. Click Metrics tab for details
4. Click Session tab for time info
5. All metrics should be live
6. Click "Go to Login" button
7. Navigate back to Dashboard
8. Metrics should still show history
```

### Test 8: Check Metrics in Browser

```
1. Open DevTools (F12)
2. Go to Application tab
3. Find Local Storage → http://localhost:3000
4. Look for "behavior_logs" key
5. Click it to see all logged events
6. Should see entries like:
   - page_view
   - step_enter
   - login_attempt
   - service_selected
   - payment_attempt
   - qr_scanned
   - approval_confirmed
   - password_reset_success
```

### Test 9: Test Responsive Design

```
1. Press F12 to open DevTools
2. Click device toolbar (mobile view)
3. Test on different sizes:
   - Mobile (375px) - Single column
   - Tablet (768px) - 2 columns
   - Desktop (1024px) - Multi-column
4. All layouts should be clean
5. Navigation should work on all sizes
```

### Test 10: Test Error Handling

```
1. Go to Register page
2. Try submitting with mismatched passwords
3. Should see error message
4. Try password < 6 characters
5. Should see error message
6. Login page accepts any input (demo)
```

---

## Useful Commands

### Build for Production

```bash
npm run build
```

Creates optimized production build in `build/` folder

### Run Tests

```bash
npm test
```

Launches test runner (if tests added)

### Eject Configuration (⚠️ One-way!)

```bash
npm run eject
```

Exposes Webpack config (not recommended)

### Clear npm Cache

```bash
npm cache clean --force
npm install
npm start
```

---

## Troubleshooting

### Issue: App won't start

```bash
# Solution 1: Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm start

# Solution 2: Check if port 3000 is in use
# Kill process on port 3000 or change port:
PORT=3001 npm start
```

### Issue: Tailwind CSS not working

```bash
# Check tailwind installation
npm list tailwindcss

# Reinstall if needed
npm install -D tailwindcss postcss autoprefixer

# Restart server
npm start
```

### Issue: Metrics not showing in header

```bash
# In browser console, check localStorage:
localStorage.getItem('behavior_logs')

# Should show JSON array of events
# If empty, interact with pages more
```

### Issue: Routes not working

```bash
# Check browser console for errors
# Verify you're visiting correct URLs:
# - http://localhost:3000/
# - http://localhost:3000/login
# - http://localhost:3000/register
# - http://localhost:3000/transaction
# - http://localhost:3000/recovery
# - http://localhost:3000/dashboard
```

### Issue: Styles look different

```bash
# Verify CSS imports in index.js:
import './index.css'  // This must be there

# Check tailwind.config.js exists
ls tailwind.config.js

# Check postcss.config.js exists
ls postcss.config.js

# Restart dev server
npm start
```

---

## Browser DevTools Tips

### View Metrics Log

```javascript
// In browser console:
const logs = JSON.parse(localStorage.getItem("behavior_logs") || "[]");
console.table(logs);
```

### Clear All Logs

```javascript
// In browser console:
localStorage.removeItem("behavior_logs");
console.log("Logs cleared!");
```

### Check Specific Flow

```javascript
// In browser console:
const logs = JSON.parse(localStorage.getItem("behavior_logs") || "[]");
const loginEvents = logs.filter((e) => e.flowId === "login");
console.table(loginEvents);
```

### Monitor Real-time Metrics

```javascript
// Keep this in console to see live updates every 2 seconds
setInterval(() => {
  const logs = JSON.parse(localStorage.getItem("behavior_logs") || "[]");
  const latestEvent = logs[logs.length - 1];
  console.clear();
  console.log("Latest event:", latestEvent);
  console.table(logs.slice(-5)); // Last 5 events
}, 2000);
```

---

## File Structure to Verify

After setup, you should have:

```
copyforzip/
├── node_modules/          ← Installed after npm install
├── public/                ← Static files
│   └── index.html
├── src/
│   ├── App.js            ← Main app component
│   ├── index.js          ← Entry point
│   ├── index.css         ← Tailwind CSS
│   ├── pages/
│   │   ├── Home.js
│   │   ├── Login.js
│   │   ├── Register.js
│   │   ├── Transaction.js
│   │   ├── Recovery.js
│   │   └── Dashboard.js
│   ├── components/
│   │   ├── AdaptiveButton.js
│   │   └── AdaptiveInput.js
│   ├── hooks/
│   ├── adaptation/
│   └── logging/
├── tailwind.config.js     ← Tailwind configuration
├── postcss.config.js      ← PostCSS configuration
├── package.json           ← Dependencies
└── .gitignore

Documentation Files:
├── SUMMARY.md            ← This file!
├── QUICK_START.md        ← Quick guide
├── IMPLEMENTATION_GUIDE.md
├── PAGE_FLOWS.md
└── METRICS_ARCHITECTURE.md
```

---

## Next Steps

### If Everything Works ✅

1. Read the QUICK_START.md for feature overview
2. Read IMPLEMENTATION_GUIDE.md for technical details
3. Explore the code and modify as needed
4. Test different scenarios from the Testing Guide
5. Check localStorage events in DevTools

### If Something Doesn't Work ❌

1. Check the Troubleshooting section
2. Look at browser console for errors (F12)
3. Verify all files are present
4. Try the "Clear cache and reinstall" solution
5. Check that npm install completed successfully

### Ready to Customize?

- Modify colors in `tailwind.config.js`
- Add new pages in `src/pages/`
- Extend metrics in `src/hooks/`
- Update UI variants in `src/adaptation/`

---

## Quick Reference

| Task                 | Command                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Install dependencies | `npm install`                                                      |
| Start dev server     | `npm start`                                                        |
| Build for production | `npm run build`                                                    |
| Open browser console | `F12`                                                              |
| Clear logs           | `localStorage.removeItem('behavior_logs')`                         |
| View logs            | `console.table(JSON.parse(localStorage.getItem('behavior_logs')))` |
| Hot reload           | Edit file → Auto-saves → Browser updates                           |
| Stop server          | `Ctrl+C` in terminal                                               |

---

## Support

For issues or questions:

1. Check browser console (F12) for errors
2. Review the documentation files
3. Check the Troubleshooting section
4. Verify file structure is correct
5. Try fresh install with clean cache

Happy testing! 🚀
