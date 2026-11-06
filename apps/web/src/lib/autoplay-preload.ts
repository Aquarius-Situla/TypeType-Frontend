const AUTOPLAY_PRELOAD_WINDOW_MS = 45_000;

export function shouldPreloadAutoplayTarget(
  positionMs: number,
  durationMs: number,
  enabled: boolean,
  hasTarget: boolean,
): boolean {
  if (!enabled || !hasTarget || positionMs <= 0 || durationMs <= 0) return false;
  return durationMs - positionMs <= AUTOPLAY_PRELOAD_WINDOW_MS;
}

// A refused preload (the server paces background requests) is asked again only after a pause:
// playback reports its position several times a second.
const AUTOPLAY_PRELOAD_RETRY_MS = 30_000;

export function canRetryAutoplayPreload(failedAt: number | undefined, now: number): boolean {
  return failedAt === undefined || now - failedAt >= AUTOPLAY_PRELOAD_RETRY_MS;
}
