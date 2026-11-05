import { toWatchSourceUrl } from "./watch-url";

export function earlyWatchStreamUrl(
  pathname: string,
  search: Record<string, unknown>,
  authReady: boolean,
  instanceLoading: boolean,
): string | null {
  if (pathname !== "/watch" || !authReady || !instanceLoading) return null;
  const v = typeof search.v === "string" ? search.v.trim() : "";
  if (v === "") return null;
  const url = toWatchSourceUrl(v);
  return url.startsWith("http") ? url : null;
}
