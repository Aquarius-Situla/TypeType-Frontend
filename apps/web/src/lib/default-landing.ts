export const DEFAULT_LANDING_STORAGE_KEY = "typetype-default-landing-page";
export const HIDE_HOME_STORAGE_KEY = "typetype-hide-home-recommendations";

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
): boolean {
  let landing = defaultLandingPage;
  let hide = hideHomeRecommendations;
  if ((landing === undefined || landing === "home") && typeof window !== "undefined") {
    const stored = window.localStorage.getItem(DEFAULT_LANDING_STORAGE_KEY);
    if (stored) landing = stored;
  }
  if ((hide === undefined || hide === false) && typeof window !== "undefined") {
    const stored = window.localStorage.getItem(HIDE_HOME_STORAGE_KEY);
    if (stored !== null) hide = stored === "true";
  }
  return Boolean(hide) && Boolean(defaultLandingPath(landing ?? ""));
}

export function readStoredHideHome(): boolean | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(HIDE_HOME_STORAGE_KEY);
    if (stored === "true") return true;
    if (stored === "false") return false;
    return null;
  } catch {
    return null;
  }
}

export function readStoredDefaultLandingPath(): string | null {
  try {
    if (typeof window === "undefined") return null;
    const stored = window.localStorage.getItem(DEFAULT_LANDING_STORAGE_KEY);
    return stored ? defaultLandingPath(stored) : null;
  } catch {
    return null;
  }
}

export function syncStoredLandingSettings(
  defaultLandingPage?: string,
  hideHomeRecommendations?: boolean,
): void {
  try {
    if (typeof window === "undefined") return;
    if (defaultLandingPage !== undefined) {
      window.localStorage.setItem(DEFAULT_LANDING_STORAGE_KEY, defaultLandingPage);
    }
    if (hideHomeRecommendations !== undefined) {
      window.localStorage.setItem(HIDE_HOME_STORAGE_KEY, String(hideHomeRecommendations));
    }
  } catch {}
}
