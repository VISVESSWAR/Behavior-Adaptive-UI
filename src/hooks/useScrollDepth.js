import { useEffect, useState } from "react";
import { logEvent } from "../logging/eventLogger";

export default function useScrollDepth(flowId, stepId) {
  const [scrollDepth, setScrollDepth] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const scrollTop = window.scrollY;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;

      if (maxScroll > 0) {
        const depth = scrollTop / maxScroll;
        setScrollDepth(depth);

        logEvent({
          type: "scroll",
          flowId,
          stepId,
          value: { depth }
        });
      }
    }

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [flowId, stepId]);

  return scrollDepth;
}
