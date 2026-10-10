const MILLISECOND_THRESHOLD = 1e11;
const DAY_MS = 86400000;

export function toBilibiliSessionTimeMs(timestamp?: number): number | null {
  if (!timestamp || timestamp <= 0) return null;
  return timestamp > MILLISECOND_THRESHOLD ? timestamp : timestamp * 1000;
}

export function formatBilibiliSessionTime(timestamp?: number): string {
  const ms = toBilibiliSessionTimeMs(timestamp);
  if (ms === null) return "—";
  return new Date(ms).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function bilibiliSessionDaysLeft(timestamp?: number, now = Date.now()): number {
  const ms = toBilibiliSessionTimeMs(timestamp);
  return ms === null ? 0 : Math.ceil((ms - now) / DAY_MS);
}
