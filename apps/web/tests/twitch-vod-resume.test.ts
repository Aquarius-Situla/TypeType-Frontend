import { expect, test } from "bun:test";
import { vodResumeAt } from "../src/hooks/use-twitch-vod-progress";

test("a VOD does not resume before the progress of this visit is fetched", () => {
  expect(vodResumeAt(false, 600_000, 7_200, false, 0)).toBeNull();
  expect(vodResumeAt(false, 0, 7_200, false, 0)).toBeNull();
});

test("a VOD resumes at the fetched position", () => {
  expect(vodResumeAt(true, 2_400_000, 7_200, false, 0)).toBe(2_400_000);
});

test("a watched VOD starts over unless it is still recording", () => {
  expect(vodResumeAt(true, 7_180_000, 7_200, false, 0)).toBe(0);
  expect(vodResumeAt(true, 7_180_000, 7_200, true, 0)).toBe(7_180_000);
});
