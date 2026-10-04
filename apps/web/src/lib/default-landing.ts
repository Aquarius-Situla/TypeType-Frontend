const DEFAULT_LANDING_STORAGE_KEY = "typetype-default-landing-page";
const HIDE_HOME_STORAGE_KEY = "typetype-hide-home-recommendations";

function scopedStorageKey(key: string, userId?: string | null): string {
  const normalized = userId?.trim();
  return `${key}:${normalized ? encodeURIComponent(normalized) : "anonymous"}`;
}

function storage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {}
  return null;
}

function readStorageValue(key: string, userId?: string | null): string | null {
  try {
    return storage()?.getItem(scopedStorageKey(key, userId)) ?? null;
  } catch {
    return null;
  }
}

export function defaultLandingPath(value: string): string | null {
  switch (value) {
    case "subscriptions":
      return "/subscriptions";
    case "history":
      return "/history";
    case "playlists":
      return "/playlists";
    case "watch-later":
      return "/watch-later";
    case "favorites":
      return "/favorites";
    default:
      return null;
  }
}

export function shouldHideHomeNavigation(
  defaultLandingPage?: string,
  hideHomeRecommendations?: boolean,
  userId?: string | null,
): boolean {
  let landing = defaultLandingPage;
  let hide = hideHomeRecommendations;
  if (landing === undefined || landing === "home") {
    const stored = readStorageValue(DEFAULT_LANDING_STORAGE_KEY, userId);
    if (stored) landing = stored;
  }
  if (hide === undefined || hide === false) {
    const stored = readStorageValue(HIDE_HOME_STORAGE_KEY, userId);
    if (stored !== null) hide = stored === "true";
  }
  return Boolean(hide) && Boolean(defaultLandingPath(landing ?? ""));
}

export function readStoredLandingSettings(userId?: string | null): {
  defaultLandingPage?: string;
  hideHomeRecommendations?: boolean;
} {
  const defaultLandingPage = readStorageValue(DEFAULT_LANDING_STORAGE_KEY, userId);
  const storedHideHome = readStorageValue(HIDE_HOME_STORAGE_KEY, userId);
  return {
    ...(defaultLandingPage ? { defaultLandingPage } : {}),
    ...(storedHideHome !== null ? { hideHomeRecommendations: storedHideHome === "true" } : {}),
  };
}

export function readStoredDefaultLandingPath(userId?: string | null): string | null {
  const { defaultLandingPage } = readStoredLandingSettings(userId);
  return defaultLandingPage ? defaultLandingPath(defaultLandingPage) : null;
}

export function syncStoredLandingSettings(
  defaultLandingPage?: string,
  hideHomeRecommendations?: boolean,
  userId?: string | null,
): void {
  try {
    const target = storage();
    if (!target) return;
    if (defaultLandingPage !== undefined) {
      target.setItem(scopedStorageKey(DEFAULT_LANDING_STORAGE_KEY, userId), defaultLandingPage);
    }
    if (hideHomeRecommendations !== undefined) {
      target.setItem(
        scopedStorageKey(HIDE_HOME_STORAGE_KEY, userId),
        String(hideHomeRecommendations),
      );
    }
  } catch {}
}

export function clearStoredLandingSettings(userId?: string | null): void {
  const target = storage();
  if (!target) return;
  target.removeItem(scopedStorageKey(DEFAULT_LANDING_STORAGE_KEY, userId));
  target.removeItem(scopedStorageKey(HIDE_HOME_STORAGE_KEY, userId));
  target.removeItem(DEFAULT_LANDING_STORAGE_KEY);
  target.removeItem(HIDE_HOME_STORAGE_KEY);
}
