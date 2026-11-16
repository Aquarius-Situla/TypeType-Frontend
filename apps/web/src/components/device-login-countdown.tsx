import { useEffect, useState } from "react";
import { m } from "../paraglide/messages.js";

type Props = {
  expiresAt: number;
  barClassName: string;
};

function remaining(expiresAt: number): number {
  return Math.max(0, expiresAt - Date.now());
}

function clock(ms: number): string {
  const total = Math.ceil(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

export function DeviceLoginCountdown({ expiresAt, barClassName }: Props) {
  const [lifetime] = useState(() => remaining(expiresAt));
  const [left, setLeft] = useState(lifetime);

  useEffect(() => {
    const timer = window.setInterval(() => setLeft(remaining(expiresAt)), 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);

  const progress = lifetime > 0 ? (left / lifetime) * 100 : 0;
  return (
    <div className="flex flex-col gap-2">
      <div className="h-1 w-full max-w-sm overflow-hidden rounded-full bg-surface-strong">
        <div
          className={`h-full transition-[width] duration-1000 ease-linear ${barClassName}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-fg-soft text-xs">
        {m.ui_device_login_expires_in({ time: clock(left) })} · {m.ui_device_login_waiting()}
      </p>
    </div>
  );
}
