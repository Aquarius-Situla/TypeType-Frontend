import { expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import {
  isPermanentlyUnavailableError,
  resolveStreamErrorMessage,
  streamRetryNotice,
} from "../src/lib/stream-error-message";

test("explains provider access blocks and suggests a server-side VPN", () => {
  const error = new ApiError(
    "YouTube requested CAPTCHA verification",
    422,
    "provider_access_blocked",
  );

  expect(resolveStreamErrorMessage(error)).toContain("VPN");
  expect(resolveStreamErrorMessage(error)).toContain("TypeType server");
});

test("explains region restrictions without treating every 422 as a VPN issue", () => {
  const region = new ApiError("Only available in Japan", 400, "geographic_restriction");
  const noStream = new ApiError(
    "No compatible stream is available for this video",
    422,
    "no_playable_streams",
  );

  expect(resolveStreamErrorMessage(region)).toContain("region");
  expect(resolveStreamErrorMessage(region)).toContain("VPN");
  expect(resolveStreamErrorMessage(noStream)).not.toContain("VPN");
});

test("maps unknown 422 responses to a retry message", () => {
  const error = new ApiError("internal provider detail", 422, "error");

  expect(resolveStreamErrorMessage(error)).toBe(
    "The video service could not provide a playable stream. Try again later.",
  );
});

test("keeps legacy provider messages actionable before code rollout", () => {
  expect(
    resolveStreamErrorMessage(new ApiError("Your IP is blocked by YouTube", 422, null)),
  ).toContain("VPN");
  expect(
    resolveStreamErrorMessage(
      new ApiError("This video is not available in your country", 400, null),
    ),
  ).toContain("VPN");
});

test("keeps unrelated status errors available to their existing handlers", () => {
  expect(resolveStreamErrorMessage(new ApiError("Bad request", 400, "bad_request"))).toBeNull();
});

test("explains temporary provider failures instead of a hard failure", () => {
  const unavailable = resolveStreamErrorMessage(new ApiError("busy", 503, null, null, 15_000));
  expect(unavailable).toContain("temporarily unavailable");
  expect(resolveStreamErrorMessage(new ApiError("slow", 504, "upstream_timeout"))).toBe(
    unavailable,
  );
  expect(resolveStreamErrorMessage(new ApiError("risk", 429, "provider_rate_limited"))).toBe(
    unavailable,
  );
});

test("keeps the bot-check explanation for a blocked provider answered with 503", () => {
  const error = new ApiError("bot check", 503, "provider_access_blocked", null, 60_000);
  expect(resolveStreamErrorMessage(error)).toContain("VPN");
});

test("treats missing provider data as an unavailable stream", () => {
  expect(
    resolveStreamErrorMessage(new ApiError("No value present", 422, "provider_data_missing")),
  ).toContain("could not provide a playable stream");
});

test("shows a retry notice only while a temporary failure is retried", () => {
  const busy = new ApiError("busy", 429, "provider_paced", null, 2_000);
  expect(streamRetryNotice(busy, true)).toContain("Retrying");
  expect(streamRetryNotice(busy, false)).toBeUndefined();
  expect(streamRetryNotice(new ApiError("gone", 422, "private_content"), true)).toBeUndefined();
});

test("names a video the provider no longer serves and lets a playlist skip it", () => {
  const gone = new ApiError("This video is not available", 404, "content_unavailable");
  const busy = new ApiError("busy", 429, "provider_paced", null, 2_000);

  expect(resolveStreamErrorMessage(gone)).toContain("no longer available");
  expect(isPermanentlyUnavailableError(gone)).toBe(true);
  expect(isPermanentlyUnavailableError(busy)).toBe(false);
  expect(isPermanentlyUnavailableError(new Error("offline"))).toBe(false);
});
