import { expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import {
  apiRetryDelay,
  isTemporaryApiError,
  retryApiCall,
  shouldRetryApiError,
} from "../src/lib/api-retry";
import { parseRetryAfterMs } from "../src/lib/retry-after";

function apiError(status: number, retryAfterMs: number | null = null, code: string | null = null) {
  return new ApiError("failed", status, code, null, retryAfterMs);
}

test("parses Retry-After seconds and HTTP dates", () => {
  expect(parseRetryAfterMs("15")).toBe(15_000);
  expect(parseRetryAfterMs(" 0 ")).toBe(0);
  expect(parseRetryAfterMs("Thu, 01 Jan 2026 00:01:00 GMT", Date.UTC(2026, 0, 1))).toBe(60_000);
  expect(parseRetryAfterMs("soon")).toBeNull();
  expect(parseRetryAfterMs(null)).toBeNull();
});

test("treats rate limits, unavailable providers and upstream timeouts as temporary", () => {
  expect(isTemporaryApiError(apiError(429))).toBe(true);
  expect(isTemporaryApiError(apiError(503))).toBe(true);
  expect(isTemporaryApiError(apiError(504))).toBe(true);
  expect(isTemporaryApiError(apiError(422))).toBe(false);
  expect(isTemporaryApiError(new Error("network"))).toBe(false);
});

test("retries a temporary failure the server asks to retry soon", () => {
  const error = apiError(503, 15_000, "provider_access_blocked");
  expect(shouldRetryApiError(0, error)).toBe(true);
  expect(shouldRetryApiError(1, error)).toBe(true);
  expect(shouldRetryApiError(2, error)).toBe(false);
  expect(apiRetryDelay(0, error)).toBe(15_000);
});

test("stops retrying when the server asks to wait longer than the page should", () => {
  expect(shouldRetryApiError(0, apiError(503, 60_000, "provider_access_blocked"))).toBe(false);
  expect(shouldRetryApiError(0, apiError(429, 60_000, "provider_rate_limited"))).toBe(false);
});

test("never retries a definitive client error", () => {
  expect(shouldRetryApiError(0, apiError(422, null, "provider_data_missing"))).toBe(false);
  expect(shouldRetryApiError(0, apiError(404))).toBe(false);
});

test("keeps the exponential delay without Retry-After", () => {
  expect(apiRetryDelay(0, apiError(504))).toBe(300);
  expect(apiRetryDelay(3, apiError(500))).toBe(1500);
  expect(shouldRetryApiError(2, apiError(500))).toBe(true);
  expect(shouldRetryApiError(3, apiError(500))).toBe(false);
});

test("a call cut by a network drop is sent again once the server answers", async () => {
  let calls = 0;
  const saved = await retryApiCall(async () => {
    calls += 1;
    if (calls < 3) throw new TypeError("Failed to fetch");
    return "saved";
  });
  expect(saved).toBe("saved");
  expect(calls).toBe(3);
});

test("a refused call is not sent again", async () => {
  let calls = 0;
  const refused = retryApiCall(async () => {
    calls += 1;
    throw apiError(400);
  });
  await expect(refused).rejects.toBeInstanceOf(ApiError);
  expect(calls).toBe(1);
});
