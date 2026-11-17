import { ApiError } from "./api";

export type VodChatFailure = {
  videoId: string;
  missing: boolean;
  delayMs: number;
  retryAt: number;
};

const FIRST_RETRY_MS = 5_000;
const MAX_RETRY_MS = 60_000;

// A 404 means this instance or this video has no chat replay: asking again only repeats it.
export function nextVodChatFailure(
  previous: VodChatFailure | null,
  videoId: string,
  error: unknown,
  now: number,
): VodChatFailure {
  const missing = error instanceof ApiError && error.status === 404;
  const last = previous?.videoId === videoId ? previous.delayMs : 0;
  const waited = last > 0 ? Math.min(last * 2, MAX_RETRY_MS) : FIRST_RETRY_MS;
  const retryAfter = error instanceof ApiError ? (error.retryAfterMs ?? 0) : 0;
  const delayMs = Math.max(waited, retryAfter);
  return { videoId, missing, delayMs, retryAt: now + delayMs };
}

export function vodChatBlocked(failure: VodChatFailure | null, videoId: string, now: number) {
  if (failure?.videoId !== videoId) return false;
  return failure.missing || now < failure.retryAt;
}
