import { expect, test } from "bun:test";
import { proxyImage } from "../src/lib/proxy";
import { streamPartPlaylistItems } from "../src/lib/stream-parts";
import type { StreamPartItem } from "../src/types/stream-parts";

const parts: StreamPartItem[] = [
  {
    page: 2,
    title: "Second",
    url: "https://www.bilibili.com/video/BV1multi?p=2",
    thumbnailUrl: "https://i0.hdslb.com/second.jpg",
    duration: 90,
  },
  {
    page: 1,
    title: "First",
    url: "https://www.bilibili.com/video/BV1multi?p=1",
    thumbnailUrl: "https://i0.hdslb.com/first.jpg",
    duration: 60,
  },
  {
    page: 1,
    title: "Duplicate",
    url: "https://www.bilibili.com/video/BV1multi?p=1",
    thumbnailUrl: "",
    duration: 60,
  },
];

test("maps multipart items in page order without duplicates", () => {
  expect(streamPartPlaylistItems(parts)).toEqual([
    {
      key: "part-1-https://www.bilibili.com/video/BV1multi?p=1",
      url: "https://www.bilibili.com/video/BV1multi?p=1",
      title: "First",
      thumbnail: proxyImage("https://i0.hdslb.com/first.jpg"),
    },
    {
      key: "part-2-https://www.bilibili.com/video/BV1multi?p=2",
      url: "https://www.bilibili.com/video/BV1multi?p=2",
      title: "Second",
      thumbnail: proxyImage("https://i0.hdslb.com/second.jpg"),
    },
  ]);
});

test("returns no panel rows without multipart metadata", () => {
  expect(streamPartPlaylistItems(undefined)).toEqual([]);
});
