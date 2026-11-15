import { authedJson } from "./authed";
import { API_BASE } from "./env";

export type FocusSettings = {
  enabled: boolean;
  entertainmentGroupId: string | null;
  transitionDays: number;
  archiveDays: number;
  startedAt: number | null;
  disableAt: number | null;
  entertainmentShare: number;
};

export type FocusSettingsRequest = {
  enabled: boolean;
  entertainmentGroupId?: string | null;
  transitionDays?: number;
  archiveDays?: number;
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
