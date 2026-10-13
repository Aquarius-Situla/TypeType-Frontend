import { describe, expect, test } from "bun:test";
import { parseTextSegments, sameVideoTimestampSeconds } from "../src/lib/rich-text";

describe("rich text segments", () => {
  test("keeps links, timecodes, and surrounding text interactive", () => {
    expect(parseTextSegments("Watch 1:23 https://example.com/video")).toEqual([
      { id: "t0", type: "text", value: "Watch " },
      { id: "c1", type: "timecode", value: "1:23", seconds: 83 },
      { id: "t2", type: "text", value: " " },
      { id: "u3", type: "url", value: "https://example.com/video" },
    ]);
  });

  test("does not create empty segments", () => {
    expect(parseTextSegments("")).toEqual([]);
    expect(parseTextSegments("1:23")).toEqual([
      { id: "c0", type: "timecode", value: "1:23", seconds: 83 },
    ]);
  });

  test("recognizes timestamps linked to the current YouTube video", () => {
    expect(
      sameVideoTimestampSeconds(
        "https://www.youtube.com/watch?v=P6mnbFs315U&t=889",
        "https://www.youtube.com/watch?v=P6mnbFs315U",
      ),
    ).toBe(889);
    expect(
      sameVideoTimestampSeconds(
        "https://www.youtube.com/watch?v=P6mnbFs315U&t=14m49s",
        "https://youtu.be/P6mnbFs315U",
      ),
    ).toBe(889);
  });

  test("does not treat another video link as an in-player timestamp", () => {
    expect(
      sameVideoTimestampSeconds(
        "https://www.youtube.com/watch?v=Qzxc1234ABC&t=889",
        "https://www.youtube.com/watch?v=P6mnbFs315U",
      ),
    ).toBeNull();
  });
});
