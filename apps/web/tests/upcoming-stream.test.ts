import { describe, expect, test } from "bun:test";
import { isUpcomingStream } from "../src/lib/upcoming-stream";

describe("upcoming live events", () => {
  test("a video announced for later is upcoming", () => {
    expect(isUpcomingStream({ publishedAt: Date.now() + 3_600_000 })).toBe(true);
  });

  test("a published video, or one without a date, is not", () => {
    expect(isUpcomingStream({ publishedAt: Date.now() - 3_600_000 })).toBe(false);
    expect(isUpcomingStream({ publishedAt: undefined })).toBe(false);
  });
});
