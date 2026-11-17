import { expect, test } from "bun:test";
import { liveArchivePositionMs } from "../src/lib/twitch-live-archive";

test("the past broadcast position trails the live a little", () => {
  const start = "2026-11-17T18:00:00Z";
  expect(liveArchivePositionMs(start, Date.parse("2026-11-17T19:00:00Z"))).toBe(3_600_000 - 15_000);
});

test("a live just started saves the beginning, and a bad date saves nothing", () => {
  expect(liveArchivePositionMs("2026-11-17T18:00:00Z", Date.parse("2026-11-17T18:00:05Z"))).toBe(0);
  expect(liveArchivePositionMs("not a date", Date.now())).toBeNull();
});
