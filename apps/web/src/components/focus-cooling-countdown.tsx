import { type ReactElement, useEffect, useState } from "react";
import { formatCountdown } from "../lib/focus-allow-once";
import { m } from "../paraglide/messages.js";

type Props = {
  unlockAt: number;
  onComplete?: () => void;
};

export function FocusCoolingCountdown({ unlockAt, onComplete }: Props): ReactElement {
  const [remainingMs, setRemainingMs] = useState<number>(() => Math.max(0, unlockAt - Date.now()));

  useEffect(() => {
    let completed = false;
    const update = () => {
      const next = Math.max(0, unlockAt - Date.now());
      setRemainingMs(next);
      if (next === 0 && !completed) {
        completed = true;
        onComplete?.();
      }
    };
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [unlockAt, onComplete]);

  return (
    <p className="font-mono text-sm font-semibold tracking-wider text-white/90">
      {m.focus_allow_once_cooling_countdown({ time: formatCountdown(remainingMs) })}
    </p>
  );
}
