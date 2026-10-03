import { expect, test } from "bun:test";
import {
  activeStreamCollection,
  streamCollectionPlaylistItems,
} from "../src/lib/stream-collections";
import { proxyImage } from "../src/lib/proxy";
import type { StreamCollectionItem } from "../src/types/stream-collection";

const collection: StreamCollectionItem = {
  id: "season-1",
  title: "Series",
  sections: [
    {
      id: "main",
      title: "Main",
      episodes: [
        {
          videoId: "BV1first",
          title: "P1",
          url: "https://www.bilibili.com/video/BV1first",
          thumbnailUrl: "https://i0.hdslb.com/first.jpg",
        },
        {
          videoId: "BV1second",
          title: "P2",
          url: "https://www.bilibili.com/video/BV1second?p=2",
          thumbnailUrl: "https://i0.hdslb.com/second.jpg",
        },
      ],
    },
    {
      id: "extras",
      title: "Extras",
      episodes: [
        {
          videoId: "BV1bonus",
          title: "Bonus",
          url: "https://www.bilibili.com/video/BV1bonus",
          thumbnailUrl: "https://i0.hdslb.com/bonus.jpg",
        },
      ],
    },
  ],
};

test("flattens collection sections into playlist rows in extractor order", () => {
  expect(streamCollectionPlaylistItems(collection)).toEqual([
    {
      key: "BV1first",
      url: "https://www.bilibili.com/video/BV1first",
      title: "P1",
      thumbnail: proxyImage("https://i0.hdslb.com/first.jpg"),
    },
    {
      key: "BV1second",
      url: "https://www.bilibili.com/video/BV1second?p=2",
      title: "P2",
      thumbnail: proxyImage("https://i0.hdslb.com/second.jpg"),
    },
    {
      key: "BV1bonus",
      url: "https://www.bilibili.com/video/BV1bonus",
      title: "Bonus",
      thumbnail: proxyImage("https://i0.hdslb.com/bonus.jpg"),
    },
  ]);
});

test("selects the collection containing the current BiliBili part", () => {
  const other: StreamCollectionItem = {
    id: "season-2",
    title: "Other",
    sections: [],
  };

  expect(activeStreamCollection([other, collection], "BV1second?p=2")?.id).toBe("season-1");
});

test("falls back to the first non-empty collection", () => {
  const empty: StreamCollectionItem = {
    id: "empty",
    title: "Empty",
    sections: [],
  };

  expect(activeStreamCollection([empty, collection], "BV1unknown")?.id).toBe("season-1");
});
