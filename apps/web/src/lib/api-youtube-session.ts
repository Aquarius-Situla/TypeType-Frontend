import { ApiError } from "./api";
import { authed, authedJson } from "./authed";
import { API_BASE as BASE } from "./env";

export type YoutubeSessionStatus = "disconnected" | "connected" | "needs_reconnect";
export type YoutubeSessionAction = "connect" | "reconnect";

export type YoutubeSessionState = {
  status: YoutubeSessionStatus;
  updatedAt: number;
  lastUsedAt: number;
  authType?: string;
  accountLabel?: string;
};

export type YoutubeDeviceStart = {
  userCode: string;
  verificationUrl: string;
  expiresAt: number;
  intervalSeconds: number;
};

export type YoutubeDeviceStatus = "pending" | "slow_down" | "connected";

export type YoutubeRemoteBrowserSession = {
  sessionId: string;
  wsUrl: string;
  expiresAt: number;
};

export function youtubeSessionActionForError(error: unknown): YoutubeSessionAction | null {
  if (!(error instanceof ApiError)) return null;
  if (error.code === "youtube_session_needs_reconnect") return "reconnect";
  if (error.code === "youtube_session_required") return "connect";
  return null;
}

export function isYoutubeSessionActionError(error: unknown): boolean {
  return youtubeSessionActionForError(error) !== null;
}

export function fetchYoutubeSessionStatus(): Promise<YoutubeSessionState> {
  return authedJson(`${BASE}/youtube-session/status`);
}

export function startYoutubeSessionBrowser(
  returnTo?: string,
): Promise<YoutubeRemoteBrowserSession> {
  return authedJson(`${BASE}/youtube-session/browser/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnTo: returnTo ?? null }),
  });
}

export async function cancelYoutubeSessionBrowser(sessionId: string): Promise<void> {
  const res = await authed(`${BASE}/youtube-session/browser/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new ApiError("Failed to close YouTube login", res.status);
}

export async function disconnectYoutubeSession(): Promise<void> {
  const res = await authed(`${BASE}/youtube-session`, { method: "DELETE" });
  if (!res.ok) throw new ApiError("Failed to disconnect YouTube session", res.status);
}

export function startYoutubeDeviceLogin(): Promise<YoutubeDeviceStart> {
  return authedJson(`${BASE}/youtube-session/device/start`, { method: "POST" });
}

export function fetchYoutubeDeviceStatus(): Promise<{ status: YoutubeDeviceStatus }> {
  return authedJson(`${BASE}/youtube-session/device/status`);
}

export async function cancelYoutubeDeviceLogin(): Promise<void> {
  const res = await authed(`${BASE}/youtube-session/device/cancel`, { method: "POST" });
  if (!res.ok) throw new ApiError("Failed to cancel the YouTube device login", res.status);
}
