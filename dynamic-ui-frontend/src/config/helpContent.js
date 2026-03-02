// Help content configuration by page identifier
// Each section contains title and a list of items available on that page

export const helpContentConfig = {
  home: [
    {
      id: "home_views",
      title: "Available Views",
      items: [
        "Profile: View your email and recovery mode status",
        "List Shared QR: See all QR codes you've shared for peer recovery",
        "Peer Details: View list of your recovery peers",
        "Recovery Requests: Manage incoming account recovery requests from peers",
      ],
    },
    {
      id: "home_profile_actions",
      title: "Profile View Options",
      items: [
        "Check your registered email address",
        "Verify if recovery mode is enabled for your account",
        "Reference information for account recovery setup",
      ],
    },
    {
      id: "home_qr_section",
      title: "Shared QR Codes",
      items: [
        "Download or share your recovery QR codes with trusted peers",
        "Each QR contains encrypted recovery share data",
        "Peers scan these codes to approve your account recovery",
      ],
    },
    {
      id: "home_peers_section",
      title: "Peer Management",
      items: [
        "View email addresses of all your recovery peers",
        "Confirm which peers can help recover your account",
      ],
    },
    {
      id: "home_requests_section",
      title: "Recovery Requests",
      items: [
        "Approve recovery requests from other users who have you as a peer",
        "Decline requests if you don't recognize the requester",
        "Each approval contributes toward the recovery threshold",
      ],
    },
  ],

  login: [
    {
      id: "login_form_fields",
      title: "Login Form",
      items: [
        "Email: Enter your registered email address",
        "Password: Enter your account password",
        "Login Button: Submit credentials to access your account",
      ],
    },
    {
      id: "login_recovery",
      title: "Account Recovery",
      items: [
        "Use 'Recover Account' if you've forgotten your password",
        "Choose between email OTP, peer approval, or QR scan recovery",
        "Recovery process guides you through account reset",
      ],
    },
    {
      id: "login_signup",
      title: "New User Options",
      items: [
        "Click 'Signup here' to create a new account",
        "Choose password-based or peer-based recovery during signup",
        "Peer-based recovery allows multi-signature recovery protection",
      ],
    },
  ],

  signup: [
    {
      id: "signup_modes",
      title: "Recovery Mode Options",
      items: [
        "Password Mode: Simple email/password recovery only",
        "Peer-based Mode: Advanced recovery with multiple trusted peers",
      ],
    },
    {
      id: "signup_password_mode",
      title: "Password Mode Setup",
      items: [
        "Enter email address",
        "Create a strong password",
        "Account uses email-based recovery by default",
      ],
    },
    {
      id: "signup_peer_mode",
      title: "Peer-Based Mode Setup",
      items: [
        "Specify number of peers (n) - total recovery participants",
        "Set recovery threshold (k) - minimum approvals needed",
        "Enter email addresses of k trusted peers",
        "Peers receive QR codes to approve recovery requests",
        "Recovery requires k approvals from n peers",
      ],
    },
    {
      id: "signup_security",
      title: "Security Considerations",
      items: [
        "Choose peer-based mode for stronger account protection",
        "Ensure threshold is ≤ number of peers",
        "Trust your peer addresses - they control recovery",
      ],
    },
  ],

  dashboard: [
    {
      id: "dashboard_experiment_mode",
      title: "Experiment Mode Control",
      items: [
        "Toggle between 'guided' and 'advanced' UI variants",
        "Guided mode: Simplified interface with helpful hints",
        "Advanced mode: Full-featured interface for experienced users",
        "Setting persists across page reloads",
      ],
    },
    {
      id: "dashboard_metrics_display",
      title: "Real-Time Metrics",
      items: [
        "Live snapshot count: Behavioral data points collected",
        "Total sessions: Aggregate analytics data available",
        "Current metrics: Real-time user interaction statistics",
        "Auto-refreshes every second for live monitoring",
      ],
    },
    {
      id: "dashboard_export_options",
      title: "Data Export",
      items: [
        "Export CSV: Download transition data with state/action/reward",
        "Export JSON: Download complete snapshot records",
        "Use exports for offline analysis or backup",
      ],
    },
    {
      id: "dashboard_analytics",
      title: "Performance Analytics",
      items: [
        "Session tracking: Monitor total number of recorded sessions",
        "Behavioral data: Track user interaction patterns",
        "Reward metrics: Monitor reinforcement learning progress",
      ],
    },
  ],

  transaction: [
    {
      id: "transaction_basic_form",
      title: "Basic Transaction Fields",
      items: [
        "Amount: Transaction value in currency units",
        "Receiver: Email or username of recipient",
        "Note: Optional message or reference for transaction",
      ],
    },
    {
      id: "transaction_paths",
      title: "Transaction Methods",
      items: [
        "Bank Transfer: Direct bank-to-bank payment",
        "UPI Payment: Unified Payment Interface method",
        "QR Payment: Scan-based payment with QR codes",
        "Each method has different confirmation flows",
      ],
    },
    {
      id: "transaction_advanced",
      title: "Advanced Options",
      items: [
        "Show/hide advanced settings for transaction customization",
        "Select specific transaction method (multi-path support)",
        "Access peer dropdown for shared transactions",
      ],
    },
    {
      id: "transaction_flow",
      title: "Transaction Processing",
      items: [
        "Fill in basic details (amount, receiver, note)",
        "Select transaction method from dropdown",
        "Confirm transaction details",
        "10-second auto-completion timer for streamlined flow",
        "Real-time transaction status tracking",
      ],
    },
    {
      id: "transaction_peer_options",
      title: "Peer Features",
      items: [
        "View list of available peers for shared transactions",
        "Select peers to participate in payment",
        "Multi-signature transaction approval",
      ],
    },
  ],

  recovery: [
    {
      id: "recovery_step1",
      title: "Step 1: Enter Email",
      items: [
        "Provide your account email address",
        "System validates email and fetches available recovery methods",
        "Required to proceed with recovery process",
      ],
    },
    {
      id: "recovery_methods",
      title: "Recovery Method Options",
      items: [
        "Email OTP: Receive verification code via email",
        "QR Scan: Scan recovery codes from registered peers",
        "Peer Approval (Tap): Peers approve your recovery request",
        "Device Recovery: Use previously trusted device (if available)",
      ],
    },
    {
      id: "recovery_email_otp",
      title: "Email OTP Method",
      items: [
        "Receive one-time password at registered email",
        "Enter OTP to verify account ownership",
        "Set new password after verification",
      ],
    },
    {
      id: "recovery_qr_method",
      title: "QR Scan Method",
      items: [
        "Scan QR codes from your recovery peers",
        "Each QR contains encrypted recovery share",
        "Collect k shares where k is your recovery threshold",
        "System reconstructs recovery key from shares",
      ],
    },
    {
      id: "recovery_peer_approval",
      title: "Peer Approval Method",
      items: [
        "Request approval from registered recovery peers",
        "Each peer receives approval notification",
        "Collect k approvals (where k = recovery threshold)",
        "Once threshold met, proceed to password reset",
      ],
    },
    {
      id: "recovery_completion",
      title: "Recovery Completion",
      items: [
        "After method verification, set new password",
        "Password is encrypted and stored securely",
        "Account fully restored with new credentials",
      ],
    },
  ],

  metrics: [
    {
      id: "metrics_upload",
      title: "Upload CSV Data",
      items: [
        "Choose CSV file containing transition logs",
        "Format: State, Action, Reward, Task, Mode columns",
        "File parsing validates data structure",
        "Upload displays summary statistics",
      ],
    },
    {
      id: "metrics_visualizations",
      title: "Available Charts",
      items: [
        "Completion Times: Histogram of task completion duration",
        "Reward Trends: Line chart of accumulated rewards over time",
        "Error Rates: Error frequency by experiment mode",
        "Action Distribution: Bar chart of action frequencies",
        "Mode Performance: Comparative performance across modes",
      ],
    },
    {
      id: "metrics_statistics",
      title: "Statistical Summary",
      items: [
        "Mean Reward: Average reward per episode",
        "Median Reward: Middle value of reward distribution",
        "Std Deviation: Reward variance and consistency",
        "Min/Max Values: Range of observed rewards",
        "Success Rate: Percentage of completed tasks",
      ],
    },
    {
      id: "metrics_analysis",
      title: "Analysis Features",
      items: [
        "Filter visualizations by experiment mode",
        "Compare guided vs. advanced UI performance",
        "Identify optimal UI adaptation parameters",
        "Export charts for reports and presentations",
      ],
    },
  ],

  default: [
    {
      id: "help_intro",
      title: "Welcome to Help",
      items: [
        "Toggle help on current page using ? button",
        "Help content changes based on page functionality",
        "All features are logged for behavioral analysis",
      ],
    },
  ],
};

// Get help points for a specific page
export function getHelpContentForPage(pageId) {
  return helpContentConfig[pageId] || helpContentConfig.default;
}
