export const YOUTUBE_BUFFER_LEVELS = ["saver", "normal", "large"] as const;

export type YoutubeBufferLevel = (typeof YOUTUBE_BUFFER_LEVELS)[number];

export const YOUTUBE_BUFFER_BASELINE_SECONDS: Record<YoutubeBufferLevel, number> = {
  saver: 6,
  normal: 10,
  large: 25,
};

const YOUTUBE_BACK_BUFFER_BASELINE_SECONDS: Record<YoutubeBufferLevel, number> = {
  saver: 3,
  normal: 5,
  large: 15,
};

const MAX_BUFFER_SECONDS = 120;

export function isYoutubeBufferLevel(value: unknown): value is YoutubeBufferLevel {
  return typeof value === "string" && (YOUTUBE_BUFFER_LEVELS as readonly string[]).includes(value);
}

export function youtubeBufferSeconds(level: YoutubeBufferLevel, playbackRate = 1): number {
  const rate = Number.isFinite(playbackRate) && playbackRate > 1 ? playbackRate : 1;
  return Math.min(MAX_BUFFER_SECONDS, Math.round(YOUTUBE_BUFFER_BASELINE_SECONDS[level] * rate));
}

export function youtubeBackBufferSeconds(level: YoutubeBufferLevel): number {
  return YOUTUBE_BACK_BUFFER_BASELINE_SECONDS[level];
}
