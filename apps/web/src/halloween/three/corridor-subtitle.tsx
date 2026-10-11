import { useEffect, useState } from "react";
import { useSubtitle } from "../subtitle-store";

export function CorridorSubtitle() {
  const line = useSubtitle((state) => state.line);
  const [shown, setShown] = useState(line);
  useEffect(() => {
    if (line) setShown(line);
  }, [line]);
  return (
    <p
      aria-live="polite"
      className={`pointer-events-none fixed bottom-24 left-1/2 z-[75] w-[min(90vw,44rem)] -translate-x-1/2 text-center text-lg font-medium text-white [text-shadow:0_0_6px_#000,0_2px_3px_#000] transition-opacity duration-500 ${line ? "opacity-100" : "opacity-0"}`}
    >
      {shown}
    </p>
  );
}
