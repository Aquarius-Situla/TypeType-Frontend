import { expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import {
  isAllowOnceExhausted,
  resolveAllowOnceErrorKind,
  shouldShowAllowOnceAction,
} from "../src/lib/focus-allow-once";

test("shows allow-once button alongside study enrollment only on blocked video pages", () => {
  const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  expect(shouldShowAllowOnceAction(videoUrl, "focus_channel_blocked")).toBe(true);
  expect(shouldShowAllowOnceAction(videoUrl, "focus_study_pending")).toBe(true);
  expect(shouldShowAllowOnceAction(videoUrl, "focus_study_active")).toBe(false);
  expect(shouldShowAllowOnceAction(videoUrl, "focus_entertainment_blocked")).toBe(false);
  expect(shouldShowAllowOnceAction(undefined, "focus_channel_blocked")).toBe(false);
  expect(shouldShowAllowOnceAction("", "focus_channel_blocked")).toBe(false);
});

test("marks allow-once as exhausted only when daily remaining count reaches zero", () => {
  expect(isAllowOnceExhausted(undefined)).toBe(false);
  expect(isAllowOnceExhausted(3)).toBe(false);
  expect(isAllowOnceExhausted(1)).toBe(false);
  expect(isAllowOnceExhausted(0)).toBe(true);
  expect(isAllowOnceExhausted(-1)).toBe(true);
});

test("maps backend allow-once captcha and quota errors cleanly", () => {
  expect(resolveAllowOnceErrorKind(null)).toBeNull();
  expect(resolveAllowOnceErrorKind(new ApiError("Bad code", 400, "focus_invalid_captcha"))).toBe(
    "invalid_captcha",
  );
  expect(
    resolveAllowOnceErrorKind(new ApiError("No quota left", 409, "focus_allow_once_exhausted")),
  ).toBe("exhausted");
  expect(resolveAllowOnceErrorKind(new ApiError("Other", 500, "internal_error"))).toBe("generic");
});
