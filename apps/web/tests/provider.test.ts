import { expect, test } from "bun:test";
import { detectProvider, supportsBulletComments } from "../src/lib/provider";

test("detects BiliBili links as supporting bullet comments", () => {
  expect(detectProvider("https://www.bilibili.com/video/BV1x9YW6FEuU")).toBe("bilibili");
  expect(supportsBulletComments("https://www.bilibili.com/video/BV1x9YW6FEuU")).toBe(true);
  expect(detectProvider("BV1x9YW6FEuU")).toBe("bilibili");
  expect(supportsBulletComments("BV1x9YW6FEuU")).toBe(true);
  expect(detectProvider("BV1UbX3B2EZQ?p=3")).toBe("bilibili");
  expect(supportsBulletComments("BV1UbX3B2EZQ?p=3")).toBe(true);
});

test("detects NicoNico links as supporting bullet comments", () => {
  expect(detectProvider("https://www.nicovideo.jp/watch/sm46525483")).toBe("nicovideo");
  expect(supportsBulletComments("https://www.nicovideo.jp/watch/sm46525483")).toBe(true);
  expect(detectProvider("sm46525483")).toBe("nicovideo");
  expect(supportsBulletComments("sm46525483")).toBe(true);
});

test("keeps bullet comments disabled for providers without an extractor", () => {
  expect(detectProvider("dQw4w9WgXcQ")).toBe("youtube");
  expect(supportsBulletComments("dQw4w9WgXcQ")).toBe(false);
  expect(supportsBulletComments("https://www.youtube.com/watch?v=test")).toBe(false);
  expect(supportsBulletComments("https://example.com/video")).toBe(false);
});
