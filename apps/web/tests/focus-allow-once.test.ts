import { expect, test } from "bun:test";
import { ApiError } from "../src/lib/api";
import type { FocusSettings } from "../src/lib/api-focus";
import {
  allowOnceKindForCode,
  defaultDailyLimitForKind,
  formatCooldownMinutes,
  formatCountdown,
  isAllowOnceExhausted,
  remainingForAllowOnceKind,
  resolveAllowOnceErrorKind,
  shouldShowAllowOnceAction,
} from "../src/lib/focus-allow-once";

const baseSettings: FocusSettings = {
  enabled: true,
  entertainmentGroupId: "fun",
  studyGroupId: "study",
  schedule: "always",
  timezone: null,
  transitionDays: 60,
  archiveDays: 7,
  strictBlocking: true,
  grayscaleThumbnails: false,
  startedAt: 1,
  disableAt: null,
  entertainmentShare: 1,
  active: true,
  studyChannelKeys: [],
  allowOnceRemainingToday: 3,
  allowOnceDailyLimit: 3,
  rewatchAllowOnceRemainingToday: 2,
  rewatchAllowOnceDailyLimit: 2,
  aiReviewEnabled: true,
};

test("shows allow-once button on outside-group, pending, and entertainment-rewatch blocks", () => {
  const videoUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  expect(shouldShowAllowOnceAction(videoUrl, "focus_channel_blocked")).toBe(true);
  expect(shouldShowAllowOnceAction(videoUrl, "focus_study_pending")).toBe(true);
  expect(shouldShowAllowOnceAction(videoUrl, "focus_entertainment_rewatch_blocked")).toBe(true);
  expect(shouldShowAllowOnceAction(videoUrl, "focus_study_active")).toBe(false);
  expect(shouldShowAllowOnceAction(videoUrl, "focus_entertainment_blocked")).toBe(false);
  expect(shouldShowAllowOnceAction(undefined, "focus_channel_blocked")).toBe(false);
  expect(shouldShowAllowOnceAction("", "focus_channel_blocked")).toBe(false);
});

test("maps block codes to separate daily quotas of 3 (outside) and 2 (rewatch)", () => {
  expect(allowOnceKindForCode("focus_channel_blocked")).toBe("outside_group");
  expect(allowOnceKindForCode("focus_study_pending")).toBe("outside_group");
  expect(allowOnceKindForCode("focus_entertainment_rewatch_blocked")).toBe("entertainment_rewatch");
  expect(defaultDailyLimitForKind("outside_group")).toBe(3);
  expect(defaultDailyLimitForKind("entertainment_rewatch")).toBe(2);
  expect(remainingForAllowOnceKind(baseSettings, "outside_group")).toBe(3);
  expect(remainingForAllowOnceKind(baseSettings, "entertainment_rewatch")).toBe(2);
  expect(remainingForAllowOnceKind(undefined, "entertainment_rewatch")).toBeUndefined();
});

test("marks allow-once as exhausted only when daily remaining count reaches zero", () => {
  expect(isAllowOnceExhausted(undefined)).toBe(false);
  expect(isAllowOnceExhausted(3)).toBe(false);
  expect(isAllowOnceExhausted(1)).toBe(false);
  expect(isAllowOnceExhausted(0)).toBe(true);
  expect(isAllowOnceExhausted(-1)).toBe(true);
});

test("formats cooling-off countdowns and minutes cleanly", () => {
  expect(formatCountdown(0)).toBe("00:00");
  expect(formatCountdown(65_000)).toBe("01:05");
  expect(formatCountdown(3_600_000)).toBe("60:00");
  expect(formatCooldownMinutes(0)).toBe(0);
  expect(formatCooldownMinutes(60_000)).toBe(1);
  expect(formatCooldownMinutes(3_060_000)).toBe(51);
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
