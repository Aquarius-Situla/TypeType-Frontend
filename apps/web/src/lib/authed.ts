import { useAuthStore } from "../stores/auth-store";
import { ApiError, apiErrorFromResponse } from "./api";
import { recordApiError } from "./api-error-log";
import { isRefreshSessionRejected, refreshSession } from "./auth-session";
import { extractRequestId, recordClientEvent } from "./client-debug-log";
import { sanitizeDebugText, sanitizeRequestPath } from "./debug-sanitize";
import { normalizeApiPayload } from "./text-normalize";

function withBearer(init: RequestInit | undefined, token: string): RequestInit {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  return { ...init, headers };
}

type AuthedOptions = {
  silentStatuses?: number[];
};

function shouldLogStatus(status: number, options: AuthedOptions | undefined): boolean {
  return !(options?.silentStatuses ?? []).includes(status);
}

async function fetchAuthed(
  url: string,
  init: RequestInit | undefined,
  token: string,
  method: string,
  path: string,
): Promise<Response> {
  try {
    return await fetch(url, withBearer(init, token));
  } catch (error) {
    const message = error instanceof Error ? error.message : "network_error";
    recordApiError({
      endpoint: url,
      status: 520,
      code: "NETWORK_ERROR",
      message,
    });
    recordClientEvent("auth.network_error", {
      method,
      path,
      message: sanitizeDebugText(message),
    });
    throw error;
  }
}

function rejectExpiredSession(message: "Authentication required" | "Session expired"): never {
  useAuthStore.getState().setSignedOut();
  recordApiError({
    endpoint: "/auth/refresh",
    status: 401,
    code: message === "Session expired" ? "SESSION_EXPIRED" : "AUTH_REQUIRED",
    message,
  });
  throw new ApiError(message, 401);
}

export async function authed(
  url: string,
  init?: RequestInit,
  options?: AuthedOptions,
): Promise<Response> {
  const method = init?.method ?? "GET";
  const path = sanitizeRequestPath(url);
  let token = useAuthStore.getState().token;
  if (!token) {
    recordClientEvent("auth.missing_token_try_refresh", { method, path });
    try {
      token = await refreshSession();
    } catch (error) {
      if (isRefreshSessionRejected(error)) rejectExpiredSession("Authentication required");
      throw error;
    }
  }
  const res = await fetchAuthed(url, init, token, method, path);
  if (res.status === 401) {
    recordClientEvent("auth.unauthorized_retry", { method, path });
    let retryToken: string;
    try {
      retryToken = await refreshSession();
    } catch (error) {
      if (isRefreshSessionRejected(error)) {
        recordClientEvent("auth.session_expired", { method, path });
        rejectExpiredSession("Session expired");
      }
      throw error;
    }
    const retryRes = await fetchAuthed(url, init, retryToken, method, path);
    if (!retryRes.ok && shouldLogStatus(retryRes.status, options)) {
      recordApiError({
        endpoint: url,
        status: retryRes.status,
        code: "AUTH_RETRY_ERROR",
        message: "Retry request failed",
        requestId: extractRequestId(retryRes.headers),
      });
      recordClientEvent("auth.retry_error", {
        method,
        path,
        status: retryRes.status,
        requestId: extractRequestId(retryRes.headers),
      });
    }
    return retryRes;
  }
  if (!res.ok && shouldLogStatus(res.status, options)) {
    recordApiError({
      endpoint: url,
      status: res.status,
      code: "AUTH_RESPONSE_ERROR",
      message: "Authed request failed",
      requestId: extractRequestId(res.headers),
    });
    recordClientEvent("auth.response_error", {
      method,
      path,
      status: res.status,
      requestId: extractRequestId(res.headers),
    });
  }
  return res;
}

export async function authedJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await authed(url, init);
  if (!res.ok) throw apiErrorFromResponse(res, await res.json().catch(() => null));
  return normalizeApiPayload(await res.json()) as T;
}
