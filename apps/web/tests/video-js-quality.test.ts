import { expect, test } from "bun:test";
import { pickRendition } from "../src/lib/video-js-quality";

const ladder = [
  { id: "a", height: 160, frameRate: 30 },
  { id: "b", height: 480, frameRate: 30 },
  { id: "c", height: 720, frameRate: 30 },
  { id: "d", height: 720, frameRate: 60 },
  { id: "e", height: 1080, frameRate: 60 },
];

test("picks the preferred height with the highest frame rate", () => {
  expect(pickRendition(ladder, "720p")?.id).toBe("d");
  expect(pickRendition(ladder, "1080p")?.id).toBe("e");
});

test("falls back to the best rendition under the preference", () => {
  expect(pickRendition(ladder, "1440p")?.id).toBe("e");
  expect(pickRendition(ladder, "360p")?.id).toBe("a");
});

test("leaves automatic selection alone when there is no preference", () => {
  expect(pickRendition(ladder, "auto")).toBeNull();
  expect(pickRendition(ladder, "144p")).toBeNull();
});
