import { ApiError } from "./api";

const HOUR_MS = 3_600_000;
const YOUTUBE_CHANNEL_TABS = new Set([
  "featured",
  "videos",
  "shorts",
  "streams",
  "playlists",
  "community",
  "about",
]);

export type FocusBlockInfo = {
  code: "focus_challenge_required" | "focus_study_pending" | "focus_entertainment_blocked";
  channelUrl: string;
  channelName: string;
  channelAvatarUrl: string;
  videoTitle: string;
  unlockAt: number | null;
};

export function normalizeFocusChannelKey(value: string): string {
  const trimmed = value.trim().split("#")[0]?.split("?")[0]?.replace(/\/+$/, "") ?? "";
  const https = trimmed
    .replace(/^http:\/\//i, "https://")
    .replace(/^https:\/\/(?:www\.|m\.|music\.)youtube\.com/i, "https://youtube.com");
  try {
    const parsed = new URL(https);
    if (parsed.host.toLowerCase() !== "youtube.com") return https;
    const segments = parsed.pathname.split("/").filter(Boolean);
    const last = segments.at(-1)?.toLowerCase();
    if (segments.length >= 2 && last && YOUTUBE_CHANNEL_TABS.has(last)) {
      return `${parsed.protocol}//${parsed.host}/${segments.slice(0, -1).join("/")}`;
    }
    return `${parsed.protocol}//${parsed.host}${parsed.pathname.replace(/\/+$/, "")}`;
  } catch {
    return https;
  }
}

export function remainingCoolingOffHours(unlockAt: number, now = Date.now()): number {
  return Math.max(1, Math.ceil((unlockAt - now) / HOUR_MS));
}

function stringDetail(details: Record<string, unknown> | null, key: string): string {
  const raw = details?.[key];
  return typeof raw === "string" ? raw : "";
}

function numberDetail(details: Record<string, unknown> | null, key: string): number | null {
  const raw = details?.[key];
  return typeof raw === "number" && Number.isFinite(raw) ? raw : null;
}

export function parseFocusBlockError(error: unknown): FocusBlockInfo | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  if (
    error.code !== "focus_challenge_required" &&
    error.code !== "focus_study_pending" &&
    error.code !== "focus_entertainment_blocked"
  ) {
    return null;
  }
  return {
    code: error.code,
    channelUrl: stringDetail(error.details, "channelUrl"),
    channelName: stringDetail(error.details, "channelName"),
    channelAvatarUrl: stringDetail(error.details, "channelAvatarUrl"),
    videoTitle: stringDetail(error.details, "videoTitle"),
    unlockAt: numberDetail(error.details, "unlockAt"),
  };
}
