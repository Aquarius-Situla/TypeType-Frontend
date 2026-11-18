import { expect, test } from "bun:test";
import {
  bilibiliShortCode,
  resolveInternalLink,
  unwrapRedirectLink,
} from "../src/lib/internal-link";

const open = (href: string, twitch = true) => resolveInternalLink(href, { twitch });

test("reroutes supported videos with their list and start time", () => {
  expect(open("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("/watch?v=dQw4w9WgXcQ");
  expect(open("https://youtu.be/dQw4w9WgXcQ?t=90")).toBe("/watch?v=dQw4w9WgXcQ&t=90");
  expect(open("https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLabcdefghij123456&t=1m30s")).toBe(
    "/watch?v=dQw4w9WgXcQ&list=PLabcdefghij123456&t=1m30s",
  );
  expect(open("https://www.nicovideo.jp/watch/sm9")).toBe("/watch?v=sm9");
  expect(open("https://www.bilibili.com/video/BV1xx411c7mD")).toBe("/watch?v=BV1xx411c7mD");
  expect(open("https://nico.ms/sm9")).toBe("/watch?v=sm9");
  expect(open("https://live.nicovideo.jp/watch/lv345123")).toBe("/watch?v=nicolive.lv345123");
  expect(open("https://live.bilibili.com/7734200")).toBe("/watch?v=bililive.7734200");
  expect(open("https://nico.ms/sm9/../x")).toBeNull();
});

test("reroutes playlists and channels", () => {
  expect(open("https://www.youtube.com/playlist?list=PLabcdefghij123456")).toBe(
    "/playlist?list=PLabcdefghij123456",
  );
  expect(open("https://www.youtube.com/@SomeChannel")).toBe("/channel/youtube/@SomeChannel");
  expect(open("https://space.bilibili.com/12345")).toBe("/channel/bilibili/12345");
  expect(open("https://www.nicovideo.jp/mylist/20661414")).toBe(
    "/playlist?list=nicomylist.20661414",
  );
  expect(open("https://www.nicovideo.jp/user/123/mylist/20661414")).toBe(
    "/playlist?list=nicomylist.20661414",
  );
  expect(open("https://www.nicovideo.jp/series/213751")).toBe("/playlist?list=nicoseries.213751");
  expect(open("https://www.youtube.com/@UCrPseYLGpNygVi34QpGNqpA")).toBe(
    "/channel/youtube/UCrPseYLGpNygVi34QpGNqpA",
  );
});

test("reroutes channel addresses that have no stable id", () => {
  const channel = (url: string) => `/channel?${new URLSearchParams({ url }).toString()}`;
  expect(open("https://www.youtube.com/c/wankilfr")).toBe(
    channel("https://www.youtube.com/c/wankilfr"),
  );
  expect(open("https://m.youtube.com/user/SomeName/")).toBe(
    channel("https://www.youtube.com/user/SomeName"),
  );
  expect(open("http://youtube.com/wankilfr?si=abc")).toBe(
    channel("https://www.youtube.com/wankilfr"),
  );
  expect(open("https://www.youtube.com/c/wankilfr/playlists")).toBe(
    `${channel("https://www.youtube.com/c/wankilfr")}&tab=playlists`,
  );
  expect(open("https://ch.nicovideo.jp/some-channel")).toBe(
    channel("https://ch.nicovideo.jp/some-channel"),
  );
  expect(open("https://ch.nicovideo.jp/channel/ch2526")).toBe(
    channel("https://ch.nicovideo.jp/channel/ch2526"),
  );
});

test("keeps the channel tab of a link", () => {
  expect(open("https://www.youtube.com/@SomeChannel/streams")).toBe(
    "/channel/youtube/@SomeChannel?tab=live",
  );
  expect(open("https://www.youtube.com/channel/UCrPseYLGpNygVi34QpGNqpA/community")).toBe(
    "/channel/youtube/UCrPseYLGpNygVi34QpGNqpA?tab=posts",
  );
  expect(open("https://www.youtube.com/@SomeChannel/videos")).toBe("/channel/youtube/@SomeChannel");
});

test("does not take YouTube pages for channels", () => {
  for (const path of ["about", "feed/trending", "premium", "robots.txt", "post/UgkxAbc", "c"]) {
    expect(open(`https://www.youtube.com/${path}`)).toBeNull();
  }
  expect(open("https://www.youtube.com/c/name/unknown")).toBeNull();
  expect(open("https://www.youtube.com/c/na%2Fme")).toBeNull();
  expect(open("https://music.youtube.com/c/name")).toBeNull();
  expect(open("https://ch.nicovideo.jp/portal/anime")).toBeNull();
});

test("follows YouTube redirect links", () => {
  const redirect = "https://www.youtube.com/redirect?event=video&q=";
  expect(open(`${redirect}${encodeURIComponent("https://youtu.be/dQw4w9WgXcQ")}`)).toBe(
    "/watch?v=dQw4w9WgXcQ",
  );
  expect(unwrapRedirectLink(`${redirect}${encodeURIComponent("https://example.com/a")}`)).toBe(
    "https://example.com/a",
  );
  expect(open(`${redirect}${encodeURIComponent("https://example.com/a")}`)).toBeNull();
  expect(unwrapRedirectLink(`${redirect}${encodeURIComponent("javascript:alert(1)")}`)).toBe(
    `${redirect}javascript%3Aalert(1)`,
  );
  expect(
    open("https://www.youtube.com/attribution_link?u=%2Fwatch%3Fv%3DdQw4w9WgXcQ%26feature%3Dshare"),
  ).toBe("/watch?v=dQw4w9WgXcQ");
  expect(unwrapRedirectLink("https://www.youtube.com/attribution_link?u=//evil.example/a")).toBe(
    "https://www.youtube.com/attribution_link?u=//evil.example/a",
  );
  expect(unwrapRedirectLink("https://example.com/redirect?q=https://a.example")).toBe(
    "https://example.com/redirect?q=https://a.example",
  );
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

test("reroutes embeds, searches, tags and Twitch pages TypeType has a page for", () => {
  expect(open("https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ")).toBe("/watch?v=dQw4w9WgXcQ");
  expect(open("https://www.youtube.com/v/dQw4w9WgXcQ")).toBe("/watch?v=dQw4w9WgXcQ");
  expect(open("https://www.youtube.com/results?search_query=lofi+hip+hop")).toBe(
    "/search?q=lofi+hip+hop&service=0",
  );
  expect(open("https://www.youtube.com/hashtag/minecraft")).toBe(
    "/search?q=%23minecraft&service=0",
  );
  expect(open("https://search.bilibili.com/all?keyword=%E9%AC%BC%E7%95%9C")).toBe(
    "/search?q=%E9%AC%BC%E7%95%9C&service=5",
  );
  expect(open("https://www.nicovideo.jp/tag/VOCALOID")).toBe("/search?q=VOCALOID&service=6");
  expect(open("https://www.twitch.tv/DarkViperAU/videos")).toBe("/twitch/channel/darkviperau");
  expect(open("https://www.twitch.tv/directory/category/just-chatting")).toBe(
    "/twitch/category/just-chatting",
  );
  expect(open("https://www.twitch.tv/directory/all/tags/Speedrun")).toBe("/twitch/tag/Speedrun");
  expect(open("https://www.twitch.tv/search?term=speedrun")).toBe("/twitch/search?q=speedrun");
  expect(open("https://www.twitch.tv/directory/all/tags/a.b")).toBeNull();
  expect(open("https://www.twitch.tv/directory/category/../x")).toBeNull();
  expect(open("https://www.twitch.tv/search?term=x", false)).toBeNull();
  expect(open("https://www.youtube.com/results")).toBeNull();
});

test("recognises b23.tv share links for the server to resolve", () => {
  expect(bilibiliShortCode("https://b23.tv/AbC123x")).toBe("AbC123x");
  expect(bilibiliShortCode("https://b23.tv/AbC123x/extra")).toBeNull();
  expect(bilibiliShortCode("https://b23.tv.evil.example/AbC123x")).toBeNull();
  expect(bilibiliShortCode("https://www.bilibili.com/video/BV1xx411c7mD")).toBeNull();
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
