import { describe, expect, test } from "bun:test";
import { earlyWatchStreamUrl } from "../src/lib/early-watch-stream";

describe("early watch stream", () => {
  test("asks for the stream of a watch link while the instance still loads", () => {
    expect(earlyWatchStreamUrl("/watch", { v: "sm46976467" }, true, true)).toBe(
      "https://www.nicovideo.jp/watch/sm46976467",
    );
    expect(earlyWatchStreamUrl("/watch", { v: " BV1Xx4c6tEKM " }, true, true)).toContain(
      "BV1Xx4c6tEKM",
    );
  });

  test("leaves the stream to the watch page otherwise", () => {
    expect(earlyWatchStreamUrl("/watch", { v: "sm46976467" }, true, false)).toBeNull();
    expect(earlyWatchStreamUrl("/watch", { v: "sm46976467" }, false, true)).toBeNull();
    expect(earlyWatchStreamUrl("/watch", { v: "" }, true, true)).toBeNull();
    expect(earlyWatchStreamUrl("/search", { v: "sm46976467" }, true, true)).toBeNull();
  });
});
