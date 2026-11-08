export const NICONICO_BUFFER_LEVELS = ["saver", "normal", "large"] as const;

export type NiconicoBufferLevel = (typeof NICONICO_BUFFER_LEVELS)[number];

export const NICONICO_BUFFER_BASELINE_SECONDS: Record<NiconicoBufferLevel, number> = {
  saver: 15,
  normal: 30,
  large: 60,
};

const MAX_BUFFER_SECONDS = 120;

export function isNiconicoBufferLevel(value: unknown): value is NiconicoBufferLevel {
  return typeof value === "string" && (NICONICO_BUFFER_LEVELS as readonly string[]).includes(value);
}

export function niconicoBufferSeconds(level: NiconicoBufferLevel, playbackRate = 1): number {
  const rate = Number.isFinite(playbackRate) && playbackRate > 1 ? playbackRate : 1;
  return Math.min(MAX_BUFFER_SECONDS, Math.round(NICONICO_BUFFER_BASELINE_SECONDS[level] * rate));
}
