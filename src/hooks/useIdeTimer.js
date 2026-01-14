import { useEffect, useState } from "react";

export default function useIdleTimer() {
  const [idleTime, setIdleTime] = useState(0);

  useEffect(() => {
    let lastActivity = performance.now();

    const reset = () => {
      lastActivity = performance.now();
    };

    const interval = setInterval(() => {
      setIdleTime((performance.now() - lastActivity) / 1000);
    }, 1000);

    window.addEventListener("mousemove", reset);
    window.addEventListener("keydown", reset);
    window.addEventListener("click", reset);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", reset);
      window.removeEventListener("keydown", reset);
      window.removeEventListener("click", reset);
    };
  }, []);

  return idleTime;
}
