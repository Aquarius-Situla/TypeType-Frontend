import { describe, expect, test } from "bun:test";
import { firstFrameKey } from "../src/hooks/use-after-first-frame";

describe("firstFrameKey", () => {
  test("names each provider's video the way the watch page does", () => {
    expect(firstFrameKey("https://www.youtube.com/watch?v=Z05XGDSTe7U")).toBe("Z05XGDSTe7U");
    expect(firstFrameKey("https://www.bilibili.com/video/BV1Vx421976K")).toBe("BV1Vx421976K");
    expect(firstFrameKey("https://www.nicovideo.jp/watch/sm47084936")).toBe("sm47084936");
  });

  test("has no key without a video", () => {
    expect(firstFrameKey("")).toBeNull();
    expect(firstFrameKey("   ")).toBeNull();
  });
});
