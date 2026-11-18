import { liveArchivePositionMs } from "./twitch-live-archive";

// Releasing the slider this close to the live edge returns to the live instead of playing the recording.
export const REWIND_MIN_BEHIND_MS = 30_000;

export function rewindRangeMs(archiveStartedAt: string, now: number): number {
  return liveArchivePositionMs(archiveStartedAt, now) ?? 0;
}

export function rewindTarget(valueMs: number, rangeMs: number): number | null {
  if (rangeMs <= 0 || valueMs > rangeMs - REWIND_MIN_BEHIND_MS) return null;
  return Math.max(0, Math.round(valueMs));
}

export function rewindSliderValue(
  dragMs: number | null,
  rewinding: boolean,
  positionMs: number,
  rangeMs: number,
): number {
  if (dragMs !== null) return dragMs;
  return rewinding ? Math.min(positionMs, rangeMs) : rangeMs;
}
