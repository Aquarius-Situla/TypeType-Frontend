const STREAM_REFRESH_MIN_AGE_MS = 10 * 60 * 1000;

export type StreamRefreshClaim = { refreshedFor: number | null };

export function claimStreamRefresh(
  claim: StreamRefreshClaim,
  loadedAt: number,
  now: number,
): boolean {
  if (loadedAt <= 0 || claim.refreshedFor === loadedAt) return false;
  if (now - loadedAt < STREAM_REFRESH_MIN_AGE_MS) return false;
  claim.refreshedFor = loadedAt;
  return true;
}

export function refreshesExpiredLinks(provider: string | null): boolean {
  return provider === "bilibili" || provider === "nicovideo";
}
