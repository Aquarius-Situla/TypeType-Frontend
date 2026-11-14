import { useAuthStore } from "../stores/auth-store";
import { resolveUnauthorizedRetryToken } from "./authed";
import { sanitizeRequestPath } from "./debug-sanitize";
import { toAbsoluteApiUrl } from "./env";
import { finishPlaybackApiRequest, preparePlaybackApiRequest } from "./playback-trace";
import type { SabrPlaybackConfig } from "./sabr-source";

async function sendPrewarmRequest(
  url: string,
  token: string | null,
  signal: AbortSignal,
): Promise<Response> {
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const trace = preparePlaybackApiRequest(url, {
    method: "POST",
    headers,
    signal,
    cache: "no-store",
  });
  let response: Response;
  try {
    response = await fetch(url, trace.init);
  } catch (error) {
    finishPlaybackApiRequest(trace, 0, "network_error");
    throw error;
  }
  finishPlaybackApiRequest(trace, response.status, response.ok ? "ok" : "http_error");
  return response;
}

export async function prewarmSabrPlayback(
  config: SabrPlaybackConfig,
  signal: AbortSignal,
  startTimeMs = 0,
): Promise<void> {
  const params = new URLSearchParams({
    videoItag: String(config.videoItag),
    audioItag: String(config.audioItag),
    startTimeMs: String(Math.max(0, Math.round(startTimeMs))),
  });
  if (config.audioTrackId) params.set("audioTrackId", config.audioTrackId);
  if (config.audioOnly) params.set("audioOnly", "true");
  if (config.isLive) params.set("isLive", "true");
  params.set("prewarm", "true");
  const url = toAbsoluteApiUrl(`/sabr/playback/${encodeURIComponent(config.videoId)}?${params}`);
  const activeToken = useAuthStore.getState().token;
  let response = await sendPrewarmRequest(url, activeToken, signal);
  if (response.status === 401 && !signal.aborted) {
    const retryToken = await resolveUnauthorizedRetryToken(
      activeToken,
      "POST",
      sanitizeRequestPath(url),
    );
    if (retryToken && !signal.aborted) {
      response = await sendPrewarmRequest(url, retryToken, signal);
    }
  }
  if (!response.ok) throw new Error(`SABR prewarm failed with status ${response.status}`);
}
