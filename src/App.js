import useMouseTracker from "./hooks/useMouseTracker";
import useIdleTimer from "./hooks/useIdeTimer";
import useScrollDepth from "./hooks/useScrollDepth";
import HomePage from "./pages/Home";
import { defaultUISchema } from "./adaptation/uiSchema";
import "./style.css";

function fmt(value, digits = 2) {
  return typeof value === "number" ? value.toFixed(digits) : "0.00";
}

export default function App() {
  const metrics = useMouseTracker();
  const idleTime = useIdleTimer();
  const scrollDepth = useScrollDepth();

  return (
    <>
    <div className="container">
      <h2>Behavior Metrics Dashboard</h2>

      {/* === TEST BUTTON FOR MISCLICKS === */}
      <button
        style={{
          padding: "12px 20px",
          marginBottom: "20px",
          fontSize: "16px",
          cursor: "pointer"
        }}
        onClick={() => {
          console.log("Valid click registered");
        }}
      >
        Test Button (Valid Click)
      </button>

      <p>Session Duration: {fmt(metrics.s_session_duration)} s</p>
      <p>Total Distance: {fmt(metrics.s_total_distance)}</p>
      <p>Number of Actions: {metrics.s_num_actions || 0}</p>
      <p>Number of Clicks: {metrics.s_num_clicks || 0}</p>
      <p>Mean Time per Action: {fmt(metrics.s_mean_time_per_action)} s</p>

      <p>Velocity Mean: {fmt(metrics.s_vel_mean)}</p>
      <p>Velocity Std: {fmt(metrics.s_vel_std)}</p>

      <p>Acceleration Mean: {fmt(metrics.s_accel_mean)}</p>
      <p>Acceleration Std: {fmt(metrics.s_accel_std)}</p>

      <p>Curvature Mean: {fmt(metrics.s_curve_mean)}</p>
      <p>Curvature Std: {fmt(metrics.s_curve_std)}</p>

      <p>Jerk Mean: {fmt(metrics.s_jerk_mean)}</p>

      <p>Idle Time: {fmt(idleTime)} s</p>
      <p>Scroll Depth: {fmt(scrollDepth * 100, 1)} %</p>

      <p>
        <strong>Misclicks:</strong> {metrics.s_num_misclicks || 0}
      </p>

      <p style={{ fontSize: "12px", color: "#666" }}>
        Tip: Click outside the button to generate misclicks.
      </p>
    </div>
    <HomePage uiSchema={defaultUISchema} />
    </>
    
  );
}
