import { API_BASE } from "./env";

const RAW: string = API_BASE;

function absoluteBase(): string {
  if (RAW.startsWith("http")) return RAW;
  if (typeof window === "undefined" || !window.location?.origin) return RAW;
  return window.location.origin + RAW;
}

function mediaHandlePath(url: string): string | null {
  try {
    const parsed = new URL(url, "https://typetype.invalid");
    const match = parsed.pathname.match(/\/media\/(m1_[A-Za-z0-9_-]{24})$/);
    if (!match || parsed.search || parsed.hash) return null;
    return `/media/${match[1]}`;
  } catch {
    return null;
  }
}

export function isMediaHandleUrl(url: string): boolean {
  return mediaHandlePath(url) !== null;
}

function localMediaUrl(url: string): string | null {
  const path = mediaHandlePath(url);
  return path ? `${absoluteBase()}${path}` : null;
}

export function proxyUrl(url: string): string {
  const local = localMediaUrl(url);
  if (local) return local;
  return `${absoluteBase()}/proxy?url=${encodeURIComponent(url)}`;
}

function isRemoteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

function extractProxyTarget(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.pathname.endsWith("/proxy") && !parsed.pathname.endsWith("/api/proxy")) return null;
    return parsed.searchParams.get("url");
  } catch {
    return null;
  }
}

export function proxyDashManifest(url: string): string {
  if (!url) return url;
  const local = localMediaUrl(url);
  if (local) return local;
  return isRemoteUrl(url) ? proxyUrl(url) : url;
}

function normalizeBilibiliImageUrl(url: string): string {
  let normalized = url.trim();
  if (normalized.startsWith("//")) {
    normalized = `https:${normalized}`;
  }
  normalized = normalized.replace(/^http:\/\//, "https://");
  try {
    const parsed = new URL(normalized);
    if (parsed.hostname.endsWith("biliimg.com")) {
      parsed.hostname = "i0.hdslb.com";
      return parsed.toString();
    }
  } catch {
    // ignore
  }
  return normalized;
}

function needsProxy(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false;
    const host = parsed.hostname;
    return (
      host.endsWith("ggpht.com") ||
      host.endsWith("googleusercontent.com") ||
      host.endsWith("hdslb.com") ||
      host.endsWith("biliimg.com") ||
      host.endsWith("ytimg.com")
    );
  } catch {
    return false;
  }
}

export function proxyImage(url: string): string {
  if (!url) return url;
  const raw = extractProxyTarget(url) ?? url;
  const normalized = normalizeBilibiliImageUrl(
    raw.startsWith("httpss://") ? `https://${raw.slice(9)}` : raw,
  );
  if (!needsProxy(normalized)) return normalized;
  return proxyUrl(normalized);
}

export function toSubtitleVttUrl(url: string): string {
  const parsed = new URL(url);
  const youtubeTimedText =
    (parsed.hostname === "youtube.com" || parsed.hostname.endsWith(".youtube.com")) &&
    parsed.pathname === "/api/timedtext";
  parsed.searchParams.set("fmt", "vtt");
  if (youtubeTimedText) return parsed.toString();
  return proxyUrl(parsed.toString());
}
