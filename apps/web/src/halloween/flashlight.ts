const ON_MS = 90;
const OFF_MS = 60;

export function lampLevel(on: boolean, changedAtMs: number, nowMs: number): number {
  const elapsed = Math.max(0, nowMs - changedAtMs);
  if (!on) return Math.max(0, 1 - elapsed / OFF_MS);
  if (elapsed >= ON_MS) return 1;
  const rise = elapsed / ON_MS;
  const flutter = 0.18 * Math.sin(elapsed * 0.35) * (1 - rise);
  return Math.min(1, Math.max(0, rise + flutter));
}

export function lampRadius(width: number, height: number): number {
  return Math.min(width, height) * 0.2 + 40;
}
