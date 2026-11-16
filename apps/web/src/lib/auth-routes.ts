export type RedirectTarget =
  | "/"
  | "/import"
  | "/history"
  | "/bilibili-session"
  | "/playlists"
  | "/privacy"
  | "/profile"
  | "/settings"
  | "/subscriptions"
  | "/subscriptions/groups"
  | "/youtube-session"
  | "/twitch-session"
  | `/twitch-session?channel=${string}`
  | `/youtube-session?returnTo=${string}`
  | `/shorts?v=${string}`
  | `/link?code=${string}`;

const SHORTS_REDIRECT_PREFIX = "/shorts?v=";
const DEVICE_LINK_REDIRECT = /^\/link\?code=[A-Za-z0-9-]{1,16}$/;
const TWITCH_SESSION_REDIRECT = /^\/twitch-session\?channel=[A-Za-z0-9_]{1,25}$/;

const PROTECTED_PREFIXES = [
  "/import",
  "/history",
  "/playlists",
  "/privacy",
  "/profile",
  "/settings",
  "/subscriptions",
  "/youtube-session",
  "/bilibili-session",
  "/twitch-session",
];
const AUTH_PAGES = ["/login", "/register", "/reset-password", "/auth/oidc/callback"];
const OIDC_CALLBACK_PAGE = "/auth/oidc/callback";

export function requiresAuth(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function isAdminRoute(pathname: string): boolean {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname === "/admin-console" ||
    pathname.startsWith("/admin-console/")
  );
}

export function isAuthPage(pathname: string): boolean {
  return AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`));
}

export function shouldEnforceBootstrapRegistration(pathname: string): boolean {
  return pathname !== OIDC_CALLBACK_PAGE;
}

export function sanitizeRedirect(value: string | undefined): RedirectTarget {
  if (!value) return "/";
  if (value.startsWith(SHORTS_REDIRECT_PREFIX)) return value as `/shorts?v=${string}`;
  if (DEVICE_LINK_REDIRECT.test(value)) return value as `/link?code=${string}`;
  if (value.startsWith("/youtube-session?returnTo=")) {
    return value as `/youtube-session?returnTo=${string}`;
  }
  if (value === "/import") return "/import";
  if (value === "/history") return "/history";
  if (value === "/privacy") return "/privacy";
  if (value === "/profile") return "/profile";
  if (value === "/settings") return "/settings";
  if (value === "/subscriptions") return "/subscriptions";
  if (value === "/subscriptions/groups") return "/subscriptions/groups";
  if (value === "/youtube-session") return "/youtube-session";
  if (value === "/twitch-session") return "/twitch-session";
  if (TWITCH_SESSION_REDIRECT.test(value)) return value as `/twitch-session?channel=${string}`;
  if (value === "/playlists" || value.startsWith("/playlists/")) return "/playlists";
  return "/";
}
