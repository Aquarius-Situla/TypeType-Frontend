import { ApiError } from "./api";
import type { FocusAllowOnceKind } from "./api-focus";

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
  code:
    | "focus_channel_blocked"
    | "focus_study_pending"
    | "focus_entertainment_blocked"
    | "focus_entertainment_rewatch_blocked";
  channelUrl: string;
  channelName: string;
  channelAvatarUrl: string;
  videoTitle: string;
  unlockAt: number | null;
  allowOnceKind?: FocusAllowOnceKind | null;
  aiReviewEligible?: boolean;
  aiRejected?: boolean;
  aiRejectionExpiresAt?: number | null;
  allowOnceCooldownMs?: number | null;
  allowOncePendingUnlockAt?: number | null;
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

function booleanDetail(details: Record<string, unknown> | null, key: string): boolean {
  return details?.[key] === true;
}

function allowOnceKindDetail(details: Record<string, unknown> | null): FocusAllowOnceKind | null {
  const raw = details?.allowOnceKind;
  if (raw === "outside_group" || raw === "entertainment_rewatch") return raw;
  return null;
}

export function parseFocusBlockError(error: unknown): FocusBlockInfo | null {
  if (!(error instanceof ApiError) || error.status !== 403) return null;
  if (
    error.code !== "focus_channel_blocked" &&
    error.code !== "focus_study_pending" &&
    error.code !== "focus_entertainment_blocked" &&
    error.code !== "focus_entertainment_rewatch_blocked"
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
    allowOnceKind: allowOnceKindDetail(error.details),
    aiReviewEligible: booleanDetail(error.details, "aiReviewEligible"),
    aiRejected: booleanDetail(error.details, "aiRejected"),
    aiRejectionExpiresAt: numberDetail(error.details, "aiRejectionExpiresAt"),
    allowOnceCooldownMs: numberDetail(error.details, "allowOnceCooldownMs"),
    allowOncePendingUnlockAt: numberDetail(error.details, "allowOncePendingUnlockAt"),
  };
}
