import { expect, test } from "bun:test";
import { nextSourceState } from "../src/hooks/use-watch-source-start-time";

const opened = nextSourceState(null, {
  streamId: "BV1xx411c7mD",
  sourceKey: "video",
  sourceIdentity: "blob:first",
  retryKey: 0,
  requestedStartTime: 0,
  currentPosition: 0,
});

test("a refreshed stream URL resumes from the current position", () => {
  const refreshed = nextSourceState(opened, {
    ...opened,
    sourceIdentity: "blob:fresh",
    requestedStartTime: 1_483_000,
    currentPosition: 1_483_000,
  });

  expect(refreshed.startTime).toBe(1_483_000);
  expect(refreshed.revision).toBe(1);
});

test("the same source keeps its start time while playback moves on", () => {
  const same = nextSourceState(opened, {
    ...opened,
    requestedStartTime: 0,
    currentPosition: 90_000,
  });

  expect(same).toBe(opened);
});

test("a new video starts from its requested time", () => {
  const next = nextSourceState(opened, {
    ...opened,
    streamId: "BV1yy411c7mE",
    sourceIdentity: "blob:next",
    requestedStartTime: 12_000,
    currentPosition: 1_483_000,
  });

  expect(next.startTime).toBe(12_000);
  expect(next.revision).toBe(0);
});
