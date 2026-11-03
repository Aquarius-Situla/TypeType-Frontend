import { expect, test } from "bun:test";
import { toDirectWatchUrl } from "../src/lib/direct-watch-url";

test("a bare NicoNico video ID opens the video", () => {
  expect(toDirectWatchUrl("sm22314266")).toBe("https://www.nicovideo.jp/watch/sm22314266");
  expect(toDirectWatchUrl(" SO12345 ")).toBe("https://www.nicovideo.jp/watch/so12345");
});

test("a bare Bilibili AV number opens the video", () => {
  expect(toDirectWatchUrl("av170001")).toBe("https://www.bilibili.com/video/BV17x411w7KC");
  expect(toDirectWatchUrl("https://www.bilibili.com/video/av170001")).toBe(
    "https://www.bilibili.com/video/av170001",
  );
});

test("ordinary searches that only look like IDs stay searches", () => {
  expect(toDirectWatchUrl("sm")).toBeNull();
  expect(toDirectWatchUrl("small talk")).toBeNull();
  expect(toDirectWatchUrl("sm22314266 review")).toBeNull();
  expect(toDirectWatchUrl("av")).toBeNull();
  expect(toDirectWatchUrl("available")).toBeNull();
});

test("supported links still open directly", () => {
  expect(toDirectWatchUrl("https://www.nicovideo.jp/watch/sm9")).toBe(
    "https://www.nicovideo.jp/watch/sm9",
  );
  expect(toDirectWatchUrl("example.com/watch")).toBeNull();
});
