import { useEffect, useState } from "react";

// False on the first frame, then true: lets a screen fade in over the clip instead of popping up.
export function useAdEntrance(): boolean {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setShown(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  return shown;
}
