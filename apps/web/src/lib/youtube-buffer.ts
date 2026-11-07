export const YOUTUBE_BUFFER_LEVELS = ["saver", "normal", "large"] as const;

export type YoutubeBufferLevel = (typeof YOUTUBE_BUFFER_LEVELS)[number];

export const YOUTUBE_BUFFER_BASELINE_SECONDS: Record<YoutubeBufferLevel, number> = {
  saver: 15,
  normal: 35,
  large: 60,
};

const YOUTUBE_BACK_BUFFER_BASELINE_SECONDS: Record<YoutubeBufferLevel, number> = {
  saver: 20,
  normal: 45,
  large: 60,
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
