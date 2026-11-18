import type { FocusSettings } from "./api-focus";

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

export type FocusStatus =
  | { kind: "off" }
  | { kind: "on"; day: number; total: number; percent: number }
  | { kind: "leaving"; hours: number };

export function focusStatus(settings: FocusSettings, now: number): FocusStatus {
  if (!settings.enabled) return { kind: "off" };
  if (settings.disableAt !== null) {
    return { kind: "leaving", hours: Math.max(1, Math.ceil((settings.disableAt - now) / HOUR_MS)) };
  }
  const started = settings.startedAt ?? now;
  const day = Math.min(
    settings.transitionDays,
    Math.max(1, Math.floor((now - started) / DAY_MS) + 1),
  );
  return {
    kind: "on",
    day,
    total: settings.transitionDays,
    percent: Math.round(settings.entertainmentShare * 100),
  };
}
