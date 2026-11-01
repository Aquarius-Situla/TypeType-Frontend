export const DEFAULT_PLAYBACK_SPEED_OPTIONS = [
  0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.5, 3, 4,
] as const;

export function normalizeDefaultPlaybackSpeed(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.min(4, Math.max(0.25, value));
}

export const HOLD_PLAYBACK_SPEED_OPTIONS = [1.5, 2, 2.5, 3, 4] as const;

export function normalizeHoldPlaybackSpeed(value: number): number {
  return HOLD_PLAYBACK_SPEED_OPTIONS.find((speed) => speed === value) ?? 2;
}

export function playbackSpeedLabel(value: number): string {
  return `${value}x`;
}
