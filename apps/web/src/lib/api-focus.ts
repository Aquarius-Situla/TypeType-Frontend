import { apiErrorFromResponse } from "./api";
import { authed, authedJson } from "./authed";
import { API_BASE } from "./env";

export type FocusSchedule = "always" | "weekdays";
export type FocusAllowOnceKind = "outside_group" | "entertainment_rewatch";

export type FocusSettings = {
  enabled: boolean;
  entertainmentGroupId: string | null;
  studyGroupId: string | null;
  schedule: FocusSchedule;
  timezone: string | null;
  transitionDays: number;
  archiveDays: number;
  strictBlocking: boolean;
  grayscaleThumbnails: boolean;
  startedAt: number | null;
  disableAt: number | null;
  entertainmentShare: number;
  active: boolean;
  studyChannelKeys: string[];
  allowOnceRemainingToday: number;
  allowOnceDailyLimit: number;
  rewatchAllowOnceRemainingToday?: number;
  rewatchAllowOnceDailyLimit?: number;
  aiReviewEnabled?: boolean;
};

export type FocusSettingsRequest = {
  enabled: boolean;
  entertainmentGroupId?: string | null;
  studyGroupId?: string | null;
  schedule?: FocusSchedule;
  timezone?: string | null;
  transitionDays?: number;
  archiveDays?: number;
  strictBlocking?: boolean;
  grayscaleThumbnails?: boolean;
};

export type FocusStudyChannelRequest = {
  channelUrl: string;
  name?: string;
  avatarUrl?: string;
};

export type FocusStudyChannelResponse = {
  channelUrl: string;
  status: "active" | "pending";
  unlockAt: number | null;
};

export type FocusAllowOnceChallengeRequest = {
  videoUrl: string;
  kind?: FocusAllowOnceKind;
  timezone?: string | null;
};

export type FocusAllowOnceChallengeResponse = {
  challengeId: string;
  challengeText: string;
  expiresAt: number;
  remainingToday: number;
  dailyLimit: number;
  kind?: FocusAllowOnceKind;
  cooldownMs?: number;
};

export type FocusAllowOnceVerifyRequest = {
  challengeId: string;
  videoUrl: string;
  code: string;
  kind?: FocusAllowOnceKind;
  timezone?: string | null;
};

export type FocusAllowOnceVerifyResponse = {
  remainingToday: number;
  dailyLimit: number;
  expiresAt: number;
  kind?: FocusAllowOnceKind;
  unlockAt?: number;
};

export type FocusAllowOnceCancelResponse = {
  kind: FocusAllowOnceKind;
  remainingToday: number;
  dailyLimit: number;
};

export type FocusAiReviewRequest = {
  videoUrl: string;
  reason: string;
  timezone?: string | null;
};

export type FocusAiReviewResponse = {
  status: "approved" | "rejected" | "unavailable";
  cooldownMs?: number | null;
  rejectionExpiresAt?: number | null;
  expiresAt?: number | null;
};

const FOCUS_URL = `${API_BASE}/focus`;

export function fetchFocus(signal?: AbortSignal, timezone?: string | null): Promise<FocusSettings> {
  const url = timezone ? `${FOCUS_URL}?timezone=${encodeURIComponent(timezone)}` : FOCUS_URL;
  return authedJson(url, { signal });
}

export function saveFocus(request: FocusSettingsRequest): Promise<FocusSettings> {
  return authedJson(FOCUS_URL, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function addFocusStudyChannel(
  request: FocusStudyChannelRequest,
): Promise<FocusStudyChannelResponse> {
  return authedJson(`${FOCUS_URL}/study-channels`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function removeFocusStudyChannel(channelUrl: string): Promise<void> {
  const response = await authed(
    `${FOCUS_URL}/study-channels?url=${encodeURIComponent(channelUrl)}`,
    { method: "DELETE" },
  );
  if (!response.ok) {
    throw apiErrorFromResponse(response, await response.json().catch(() => null));
  }
}

export function requestFocusAllowOnceChallenge(
  request: FocusAllowOnceChallengeRequest,
): Promise<FocusAllowOnceChallengeResponse> {
  return authedJson(`${FOCUS_URL}/allow-once/challenge`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export function verifyFocusAllowOnce(
  request: FocusAllowOnceVerifyRequest,
): Promise<FocusAllowOnceVerifyResponse> {
  return authedJson(`${FOCUS_URL}/allow-once/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}

export async function cancelFocusAllowOncePending(
  videoUrl: string,
  timezone?: string | null,
): Promise<FocusAllowOnceCancelResponse> {
  const params = new URLSearchParams({ url: videoUrl });
  if (timezone) params.set("timezone", timezone);
  return authedJson(`${FOCUS_URL}/allow-once/pending?${params.toString()}`, {
    method: "DELETE",
  });
}

export function submitFocusAiReview(request: FocusAiReviewRequest): Promise<FocusAiReviewResponse> {
  return authedJson(`${FOCUS_URL}/ai-review`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });
}
