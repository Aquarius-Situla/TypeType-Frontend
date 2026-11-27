import { describe, expect, test } from "bun:test";
import { earlyWatchStreamUrl } from "../src/lib/early-watch-stream";

describe("early watch stream", () => {
  test("asks for the stream of a watch link as soon as the location changes", () => {
    expect(earlyWatchStreamUrl("/watch", { v: "sm46976467" }, true)).toBe(
      "https://www.nicovideo.jp/watch/sm46976467",
    );
    expect(earlyWatchStreamUrl("/watch", { v: " BV1Xx4c6tEKM " }, true)).toContain("BV1Xx4c6tEKM");
  });

  test("leaves the stream to the watch page before the session is known", () => {
    expect(earlyWatchStreamUrl("/watch", { v: "sm46976467" }, false)).toBeNull();
    expect(earlyWatchStreamUrl("/watch", { v: "" }, true)).toBeNull();
    expect(earlyWatchStreamUrl("/search", { v: "sm46976467" }, true)).toBeNull();
  });
});
