import { liveArchivePositionMs } from "./twitch-live-archive";

// Releasing the slider this close to the live edge stays on the live instead of opening the past broadcast.
export const REWIND_MIN_BEHIND_MS = 30_000;

export function rewindRangeMs(archiveStartedAt: string, now: number): number {
  return liveArchivePositionMs(archiveStartedAt, now) ?? 0;
}

export function rewindTarget(valueMs: number, rangeMs: number): number | null {
  if (rangeMs <= 0 || valueMs > rangeMs - REWIND_MIN_BEHIND_MS) return null;
  return Math.max(0, Math.round(valueMs));
}
