export function formatBilibiliSessionTime(timestamp?: number): string {
  if (!timestamp || timestamp === 0) return "—";
  const ms = timestamp > 1e11 ? timestamp : timestamp * 1000;
  return new Date(ms).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
