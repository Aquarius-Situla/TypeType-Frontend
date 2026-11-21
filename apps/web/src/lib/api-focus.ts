import { apiErrorFromResponse } from "./api";
import { authed, authedJson } from "./authed";
import { API_BASE } from "./env";

export type FocusSchedule = "always" | "weekdays";

export type FocusSettings = {
  enabled: boolean;
  entertainmentGroupId: string | null;
  studyGroupId: string | null;
  schedule: FocusSchedule;
  timezone: string | null;
  transitionDays: number;
  archiveDays: number;
  grayscaleThumbnails: boolean;
  startedAt: number | null;
  disableAt: number | null;
  entertainmentShare: number;
  active: boolean;
  focusAiEnabled: boolean;
  studyChannelKeys: string[];
};

export type FocusSettingsRequest = {
  enabled: boolean;
  entertainmentGroupId?: string | null;
  studyGroupId?: string | null;
  schedule?: FocusSchedule;
  timezone?: string | null;
  transitionDays?: number;
  archiveDays?: number;
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

const FOCUS_URL = `${API_BASE}/focus`;

export function fetchFocus(signal?: AbortSignal): Promise<FocusSettings> {
  return authedJson(FOCUS_URL, { signal });
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
