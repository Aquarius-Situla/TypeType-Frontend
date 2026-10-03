import { describe, expect, test } from "bun:test";
import {
  bilibiliSessionReturnToForWatch,
  sanitizeBilibiliSessionReturnTo,
} from "../src/lib/bilibili-session-route";

describe("BiliBili session return route", () => {
  test("preserves the watch video and playlist state", () => {
    expect(bilibiliSessionReturnToForWatch("BV123", "PL42", "1")).toBe(
      "/watch?v=BV123&list=PL42&shuffle=1",
    );
  });

  test("accepts a local watch redirect", () => {
    expect(sanitizeBilibiliSessionReturnTo("/watch?v=BV123&list=PL42")).toBe(
      "/watch?v=BV123&list=PL42",
    );
  });

  test("rejects external and non-watch redirects", () => {
    expect(sanitizeBilibiliSessionReturnTo("https://example.com/watch?v=BV123")).toBeUndefined();
    expect(sanitizeBilibiliSessionReturnTo("/settings")).toBeUndefined();
  });

  test("rejects a watch redirect without a video", () => {
    expect(sanitizeBilibiliSessionReturnTo("/watch?list=PL42")).toBeUndefined();
  });
});
