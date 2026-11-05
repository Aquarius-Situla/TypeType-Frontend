export const BILIBILI_BUFFER_LEVELS = ["saver", "normal", "large"] as const;

export type BilibiliBufferLevel = (typeof BILIBILI_BUFFER_LEVELS)[number];

export const BILIBILI_BUFFER_BASELINE_SECONDS: Record<BilibiliBufferLevel, number> = {
  saver: 8,
  normal: 15,
  large: 30,
};

const MAX_BUFFER_SECONDS = 120;

export const BILIBILI_LIGHT_KBPS = 1000;

export function isBilibiliBufferLevel(value: unknown): value is BilibiliBufferLevel {
  return typeof value === "string" && (BILIBILI_BUFFER_LEVELS as readonly string[]).includes(value);
}

export function bilibiliBufferSeconds(level: BilibiliBufferLevel, playbackRate = 1): number {
  const rate = Number.isFinite(playbackRate) && playbackRate > 1 ? playbackRate : 1;
  return Math.min(MAX_BUFFER_SECONDS, Math.round(BILIBILI_BUFFER_BASELINE_SECONDS[level] * rate));
}

export function bilibiliBufferSettings(seconds: number) {
  return {
    bufferTimeDefault: seconds,
    bufferTimeAtTopQuality: seconds,
    bufferTimeAtTopQualityLongForm: seconds,
  };
}
