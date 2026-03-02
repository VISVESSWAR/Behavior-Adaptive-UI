/**
 * HelpBar Component Usage Examples
 * 
 * The HelpBar component displays contextual help for each page.
 * It integrates with the metrics collector to log visibility toggles.
 */

/* ================================
   EXAMPLE 1: Global App Layout
   ================================ */

// In App.jsx or main layout component:
import Navbar from "./components/Navbar.jsx";
import HelpBar from "./components/HelpBar.jsx";

function AppLayout({ children, pageId = "default" }) {
  return (
    <div className="app-layout">
      {/* Navigation bar */}
      <Navbar />

      {/* Help bar positioned below navbar */}
      <HelpBar pageId={pageId} />

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}

/* ================================
   EXAMPLE 2: HomePage Usage
   ================================ */

import HelpBar from "../components/HelpBar.jsx";

export default function HomePage() {
  return (
    <>
      <HelpBar pageId="home" />
      
      <div className="page-content">
        <h1>Welcome Home</h1>
        <p>Your main dashboard content here...</p>
      </div>
    </>
  );
}

/* ================================
   EXAMPLE 3: LoginPage Usage
   ================================ */

import HelpBar from "../components/HelpBar.jsx";

export default function LoginPage() {
  return (
    <>
      <HelpBar pageId="login" />
      
      <div className="login-container">
        <form>
          <input type="email" placeholder="Email" />
          <input type="password" placeholder="Password" />
          <button type="submit">Login</button>
        </form>
      </div>
    </>
  );
}

/* ================================
   EXAMPLE 4: DashboardPage Usage
   ================================ */

import HelpBar from "../components/HelpBar.jsx";

export default function DashboardPage() {
  return (
    <>
      <HelpBar pageId="dashboard" />
      
      <div className="dashboard">
        <h2>Dashboard</h2>
        <div className="stats">
          {/* Dashboard content */}
        </div>
      </div>
    </>
  );
}

/* ================================
   EXAMPLE 5: TransactionPage Usage
   ================================ */

import HelpBar from "../components/HelpBar.jsx";

export default function TransactionPage() {
  return (
    <>
      <HelpBar pageId="transaction" />
      
      <div className="transactions">
        <h2>Transactions</h2>
        {/* Transaction list */}
      </div>
    </>
  );
}

/* ================================
   EXAMPLE 6: MetricsDashboard Usage
   ================================ */

import HelpBar from "../components/HelpBar.jsx";

export default function MetricsDashboard() {
  return (
    <>
      <HelpBar pageId="metrics" />
      
      <div className="metrics-dashboard">
        <h2>Analytics & Metrics</h2>
        {/* Metrics visualizations */}
      </div>
    </>
  );
}

/* ================================
   EXAMPLE 7: Adding New Help Content
   ================================ */

// To add help content for a new page, edit src/config/helpContent.js:

// helpContentConfig = {
//   myNewPage: [
//     {
//       id: "mynewpage_section1",
//       title: "Section 1 Help",
//       description: "Explanation of what section 1 does.",
//     },
//     {
//       id: "mynewpage_section2",
//       title: "Section 2 Help", 
//       description: "Tips for using section 2.",
//     },
//   ],
// };

// Then use it:
// <HelpBar pageId="myNewPage" />

/* ================================
   EXAMPLE 8: Metrics Logging Output
   ================================ */

// When user toggles help visibility, the following is logged:

// Console output:
// [HelpBar] Help visibility toggled: {
//   event: "help_toggle",
//   timestamp: 1704067200000,
//   pageId: "home",
//   visible: true
// }

// Metrics collector records:
// {
//   event: "help_visibility_toggle",
//   source: "HelpBar",
//   details: {
//     pageId: "home",
//     visible: true
//   }
// }

/* ================================
   EXAMPLE 9: Styling Customization
   ================================ */

// HelpBar styling can be customized by:
// 1. Modifying component CSS in HelpBar.jsx inline styles
// 2. Adding CSS classes and overriding in your stylesheet
// 3. Passing optional style props (future enhancement)

// Current styling includes:
// - Minimal, non-intrusive design
// - Blue (#0066cc) accent colors matching theme
// - Smooth transitions for show/hide
// - Responsive grid layout for help items
// - Hover effects on toggle button

/* ================================
   EXAMPLE 10: Integration with App.jsx
   ================================ */

// Complete integration pattern in main App component:

import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import HelpBar from "./components/HelpBar.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

function App() {
  const [currentPageId, setCurrentPageId] = useState("default");

  const handleRouteChange = (pageId) => {
    setCurrentPageId(pageId);
  };

  return (
    <BrowserRouter>
      <Navbar />
      <HelpBar pageId={currentPageId} />
      <Routes>
        <Route
          path="/"
          element={
            (handleRouteChange("login"), <LoginPage />)
          }
        />
        <Route
          path="/home"
          element={
            (handleRouteChange("home"), <HomePage />)
          }
        />
        <Route
          path="/dashboard"
          element={
            (handleRouteChange("dashboard"), <DashboardPage />)
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
