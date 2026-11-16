import { expect, test } from "bun:test";
import { resolveInternalLink } from "../src/lib/internal-link";

const open = (href: string, twitch = true) => resolveInternalLink(href, { twitch });

test("reroutes supported videos with their list and start time", () => {
  expect(open("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("/watch?v=dQw4w9WgXcQ");
  expect(open("https://youtu.be/dQw4w9WgXcQ?t=90")).toBe("/watch?v=dQw4w9WgXcQ&t=90");
  expect(open("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdefghij123456&t=1m30s")).toBe(
    "/watch?v=dQw4w9WgXcQ&list=PLabcdefghij123456&t=1m30s",
  );
  expect(open("https://www.nicovideo.jp/watch/sm9")).toBe("/watch?v=sm9");
  expect(open("https://www.bilibili.com/video/BV1xx411c7mD")).toBe("/watch?v=BV1xx411c7mD");
});

test("reroutes playlists and channels", () => {
  expect(open("https://www.youtube.com/playlist?list=PLabcdefghij123456")).toBe(
    "/playlist?list=PLabcdefghij123456",
  );
  expect(open("https://www.youtube.com/@SomeChannel")).toBe("/channel/youtube/@SomeChannel");
  expect(open("https://space.bilibili.com/12345")).toBe("/channel/bilibili/12345");
});

test("reroutes Twitch channels, videos and clips only when Twitch is enabled", () => {
  expect(open("https://www.twitch.tv/SomeChannel")).toBe("/twitch/watch?c=somechannel");
  expect(open("https://www.twitch.tv/videos/2928081988")).toBe("/twitch/watch?v=2928081988");
  expect(open("https://clips.twitch.tv/NiceIronicTomatoRitzMitz-MbIAZSAbxo1nKSQ3")).toBe(
    "/twitch/watch?clip=NiceIronicTomatoRitzMitz-MbIAZSAbxo1nKSQ3",
  );
  expect(open("https://www.twitch.tv/somechannel/clip/NiceIronicTomato-abc123")).toBe(
    "/twitch/watch?clip=NiceIronicTomato-abc123",
  );
  expect(open("https://www.twitch.tv/SomeChannel", false)).toBeNull();
});

test("leaves everything else to the external link warning", () => {
  expect(open("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
  expect(open("https://youtube.com.evil.example/watch?v=dQw4w9WgXcQ")).toBeNull();
  expect(open("https://clips.twitch.tv.evil.example/NiceIronicTomato")).toBeNull();
  expect(open("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=<script>")).toBe(
    "/watch?v=dQw4w9WgXcQ",
  );
  expect(open("javascript:alert(1)")).toBeNull();
  expect(open("dQw4w9WgXcQ")).toBeNull();
  expect(open("https://www.twitch.tv/directory")).toBeNull();
});
