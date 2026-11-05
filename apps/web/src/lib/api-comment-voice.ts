import { useAuthStore } from "../stores/auth-store";
import { ApiError } from "./api";
import { refreshUnauthorizedSession } from "./authed";
import { sanitizeRequestPath } from "./debug-sanitize";
import { API_BASE as BASE } from "./env";

function withToken(token: string | null): RequestInit | undefined {
  return token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;
}

export async function fetchVoiceReplyAudio(url: string): Promise<Blob> {
  const target = `${BASE}/comments/voice?${new URLSearchParams({ url })}`;
  const token = useAuthStore.getState().token;
  let response = await fetch(target, withToken(token));
  if (response.status === 401 && token) {
    const fresh = await refreshUnauthorizedSession("GET", sanitizeRequestPath(target));
    response = await fetch(target, withToken(fresh));
  }
  if (!response.ok) throw new ApiError("Voice reply audio is not available", response.status);
  return response.blob();
}
