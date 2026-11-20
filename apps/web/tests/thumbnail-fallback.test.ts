import { expect, test } from "bun:test";
import { proxyImage } from "../src/lib/proxy";
import { thumbnailCandidates } from "../src/lib/thumbnail-fallback";

const youtubeFallback = proxyImage("https://i.ytimg.com/vi/abc123def45/hqdefault.jpg");

test("a YouTube video falls back to its standard thumbnail", () => {
  expect(
    thumbnailCandidates("https://www.youtube.com/watch?v=abc123def45", "https://saved.test/a.jpg"),
  ).toEqual(["https://saved.test/a.jpg", youtubeFallback]);
});

test("a YouTube video without a saved thumbnail still gets one", () => {
  expect(thumbnailCandidates("https://www.youtube.com/watch?v=abc123def45", "")).toEqual([
    youtubeFallback,
  ]);
});

test("the fallback is not repeated when it is already the saved thumbnail", () => {
  expect(
    thumbnailCandidates("https://www.youtube.com/watch?v=abc123def45", youtubeFallback),
  ).toEqual([youtubeFallback]);
});

test("other services keep only their saved thumbnail", () => {
  expect(
    thumbnailCandidates("https://www.bilibili.com/video/BV1xx411c7mD", "https://saved.test/b.jpg"),
  ).toEqual(["https://saved.test/b.jpg"]);
});
