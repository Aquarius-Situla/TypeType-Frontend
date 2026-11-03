import { bilibiliBvidFromAvid } from "./bilibili-av";

function parseUrl(value: string): URL | null {
  const trimmed = value.trim().replace(/^<|>$/g, "");
  if (trimmed.length === 0) return null;
  try {
    return new URL(trimmed);
  } catch {
    try {
      return new URL(`https://${trimmed}`);
    } catch {
      return null;
    }
  }
}

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function isSupportedHost(host: string): boolean {
  if (host === "youtu.be") return true;
  if (hostMatches(host, "youtube.com")) return true;
  if (host === "nico.ms") return true;
  if (hostMatches(host, "nicovideo.jp")) return true;
  if (host === "b23.tv") return true;
  if (hostMatches(host, "bilibili.com")) return true;
  return false;
}

const NICONICO_VIDEO_ID = /^(sm|nm|so)\d{1,12}$/i;
const BILIBILI_AV_ID = /^av(\d{1,16})$/i;

export function toDirectWatchUrl(value: string): string | null {
  const id = value.trim();
  if (NICONICO_VIDEO_ID.test(id)) return `https://www.nicovideo.jp/watch/${id.toLowerCase()}`;
  const avid = id.match(BILIBILI_AV_ID)?.[1];
  const bvid = avid ? bilibiliBvidFromAvid(avid) : null;
  if (bvid) return `https://www.bilibili.com/video/${bvid}`;
  const parsed = parseUrl(value);
  if (!parsed) return null;
  const host = parsed.hostname.toLowerCase();
  if (!isSupportedHost(host)) return null;
  return `${parsed.origin}${parsed.pathname}${parsed.search}`;
}
