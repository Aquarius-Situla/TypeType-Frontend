export type PlayerVolumeState = {
  volume: number;
  muted: boolean;
};

export function clampPlayerVolume(volume: number): number {
  if (!Number.isFinite(volume)) return 1;
  return Math.min(1, Math.max(0, volume));
}

export function matchesPlayerVolume(
  current: PlayerVolumeState,
  target: PlayerVolumeState,
): boolean {
  return Math.abs(current.volume - target.volume) < 0.001 && current.muted === target.muted;
}

export type VolumeRestoreStep = "restore" | "matched" | "keep" | "adopt";

/**
 * Settings set the volume once per video. A later change, such as signing out mid-video and getting the
 * guest settings at full volume, must not jump the sound: the settings adopt what the player plays.
 */
export function nextVolumeRestoreStep(
  restored: boolean,
  current: PlayerVolumeState,
  target: PlayerVolumeState,
): VolumeRestoreStep {
  const matches = matchesPlayerVolume(current, target);
  if (restored) return matches ? "keep" : "adopt";
  return matches ? "matched" : "restore";
}
