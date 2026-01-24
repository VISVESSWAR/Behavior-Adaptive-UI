import { getRawLogs } from "./eventLogger";

export function exportLogs() {
  const blob = new Blob(
    [JSON.stringify(getRawLogs(), null, 2)],
    { type: "application/json" }
  );

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "mouse_logs.json";
  a.click();
}
