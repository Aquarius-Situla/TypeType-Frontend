import { recordApiError } from "./api-error-log";
import { extractRequestId, recordClientEvent } from "./client-debug-log";
import { sanitizeDebugText, sanitizeRequestPath } from "./debug-sanitize";
import { finishPlaybackApiRequest, preparePlaybackApiRequest } from "./playback-trace";
import { parseRetryAfterMs } from "./retry-after";
import { normalizeApiPayload } from "./text-normalize";

export class ApiError extends Error {
  status: number;
  code: string | null;
  requestId: string | null;
  retryAfterMs: number | null;
  constructor(
    message: string,
    status: number,
    code: string | null = null,
    requestId: string | null = null,
    retryAfterMs: number | null = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.requestId = requestId;
    this.retryAfterMs = retryAfterMs;
  }
}

type ErrorLikeBody = {
  code?: string;
  error?: string;
  message?: string;
};

async function readBody(res: Response): Promise<unknown> {
  const contentType = res.headers.get("Content-Type") ?? "";
  if (contentType.includes("application/json")) {
    return res
      .json()
      .then(normalizeApiPayload)
      .catch(() => null);
  }
  return res
    .text()
    .then(normalizeApiPayload)
    .catch(() => "");
}

function toErrorMessage(status: number, statusText: string, body: unknown): string {
  if (typeof body === "string") {
    const trimmed = body.trim();
    if (trimmed.length > 0) return trimmed;
  }
  if (body && typeof body === "object") {
    const candidate = body as ErrorLikeBody;
    if (typeof candidate.error === "string" && candidate.error.length > 0) return candidate.error;
    if (typeof candidate.message === "string" && candidate.message.length > 0)
      return candidate.message;
  }
  if (status === 429) return "Too many requests. Try again in a few seconds.";
  if (statusText.length > 0) return statusText;
  return "Request failed";
}

function toErrorCode(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const candidate = body as ErrorLikeBody;
  return typeof candidate.code === "string" && candidate.code.length > 0 ? candidate.code : null;
}

export function apiErrorFromResponse(response: Response, body: unknown): ApiError {
  const bodyRequestId =
    body && typeof body === "object" && "requestId" in body && typeof body.requestId === "string"
      ? body.requestId
      : null;
  return new ApiError(
    toErrorMessage(response.status, response.statusText, body),
    response.status,
    toErrorCode(body),
    extractRequestId(response.headers) ?? bodyRequestId,
    parseRetryAfterMs(response.headers.get("Retry-After")),
  );
}

export async function request<T>(
  url: string,
  init?: RequestInit,
  pending?: Promise<Response> | null,
): Promise<T> {
  const method = init?.method ?? "GET";
  let res: Response;
  const trace = preparePlaybackApiRequest(url, init);
  try {
    res = await (pending ?? fetch(url, trace.init));
  } catch (error) {
    finishPlaybackApiRequest(trace, 0, "network_error");
    const message = error instanceof Error ? error.message : "network_error";
    recordApiError({
      endpoint: url,
      status: 520,
      code: "NETWORK_ERROR",
      message,
    });
    recordClientEvent("api.network_error", {
      method,
      path: sanitizeRequestPath(url),
      message: sanitizeDebugText(message),
    });
    throw error;
  }
  const body = await readBody(res);
  finishPlaybackApiRequest(trace, res.status, res.ok ? "ok" : "http_error");
  if (!res.ok) {
    const requestId = extractRequestId(res.headers);
    const errorMessage = toErrorMessage(res.status, res.statusText, body);
    const errorCode = toErrorCode(body);
    recordApiError({
      endpoint: url,
      status: res.status,
      code: errorCode ?? "HTTP_ERROR",
      message: errorMessage,
      requestId,
    });
    recordClientEvent("api.response_error", {
      method,
      path: sanitizeRequestPath(url),
      status: res.status,
      requestId,
      message: sanitizeDebugText(errorMessage),
    });
    throw apiErrorFromResponse(res, body);
  }
  return body as T;
}
