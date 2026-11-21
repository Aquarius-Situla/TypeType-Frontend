import { expect, test } from "bun:test";
import type { FocusSettings } from "../src/lib/api-focus";
import { focusStatus } from "../src/lib/focus-status";

const DAY = 86_400_000;
const now = 1_800_000_000_000;

function settings(patch: Partial<FocusSettings>): FocusSettings {
  return {
    enabled: true,
    entertainmentGroupId: "group",
    studyGroupId: null,
    schedule: "always",
    timezone: null,
    transitionDays: 60,
    archiveDays: 7,
    strictBlocking: false,
    grayscaleThumbnails: false,
    startedAt: now,
    disableAt: null,
    entertainmentShare: 1,
    active: true,
    studyChannelKeys: [],
    ...patch,
  };
}

test("focus status follows the day of the transition and the share left", () => {
  expect(focusStatus(settings({ enabled: false }), now)).toEqual({ kind: "off" });
  expect(focusStatus(settings({}), now)).toEqual({ kind: "on", day: 1, total: 60, percent: 100 });
  expect(
    focusStatus(settings({ startedAt: now - 30 * DAY, entertainmentShare: 0.5 }), now),
  ).toEqual({ kind: "on", day: 31, total: 60, percent: 50 });
  expect(focusStatus(settings({ startedAt: now - 200 * DAY, entertainmentShare: 0 }), now)).toEqual(
    { kind: "on", day: 60, total: 60, percent: 0 },
  );
});

test("focus status counts down a requested exit in hours", () => {
  expect(focusStatus(settings({ disableAt: now + 18 * 3_600_000 - 1 }), now)).toEqual({
    kind: "leaving",
    hours: 18,
  });
  expect(focusStatus(settings({ disableAt: now + 1000 }), now)).toEqual({
    kind: "leaving",
    hours: 1,
  });
});
