import { expect, test } from "bun:test";
import { proxyImage } from "../src/lib/proxy";
import {
  activeStreamCollection,
  ensureCollectionMetadata,
  isCollectionPlaylist,
  streamCollectionPlaylistItems,
  streamCollectionSectionGroups,
} from "../src/lib/stream-collections";
import type { StreamCollectionItem } from "../src/types/stream-collection";

if (!("localStorage" in globalThis)) {
  const store = new Map<string, string>();
  Object.defineProperty(globalThis, "localStorage", {
    value: {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, val: string) => store.set(key, String(val)),
      removeItem: (key: string) => store.delete(key),
      clear: () => store.clear(),
    },
  });
}

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

test("groups collection sections with proxy thumbnails", () => {
  const groups = streamCollectionSectionGroups(collection);
  expect(groups).toHaveLength(2);
  expect(groups[0]).toEqual({
    id: "main",
    title: "Main",
    videos: [
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
    ],
  });
  expect(groups[1]).toEqual({
    id: "extras",
    title: "Extras",
    videos: [
      {
        key: "BV1bonus",
        url: "https://www.bilibili.com/video/BV1bonus",
        title: "Bonus",
        thumbnail: proxyImage("https://i0.hdslb.com/bonus.jpg"),
      },
    ],
  });
});

test("identifies collection playlist URLs and types", () => {
  expect(
    isCollectionPlaylist({
      url: "https://www.bilibili.com/medialist/play/23630128?business=space_collection&business_id=2045",
    }),
  ).toBe(true);
  expect(isCollectionPlaylist({ playlistType: "collection" })).toBe(true);
  expect(isCollectionPlaylist({ name: "合集·高一高二（上篇）" })).toBe(true);
  expect(isCollectionPlaylist({ playlistType: "normal", name: "Favorites" })).toBe(false);

  // Series are not collections with sections
  expect(isCollectionPlaylist({ playlistType: "series" })).toBe(false);
  expect(
    isCollectionPlaylist({
      url: "https://www.bilibili.com/medialist/play/546195?business=space_series&business_id=123",
    }),
  ).toBe(false);
  expect(
    isCollectionPlaylist({
      url: "https://space.bilibili.com/546195/channel/seriesdetail?sid=123",
    }),
  ).toBe(false);
  expect(isCollectionPlaylist({ url: "series:546195:123" })).toBe(false);
  expect(isCollectionPlaylist({ url: "bilibili:series:546195:123" })).toBe(false);
  expect(isCollectionPlaylist({ id: "series:546195:123" })).toBe(false);
  expect(isCollectionPlaylist({ id: "bilibili:series:546195:123" })).toBe(false);
  expect(isCollectionPlaylist({ id: "season:546195:123" })).toBe(true);
});

test("ensureCollectionMetadata prioritizes strict ID match, backfills missing episodes, and refreshes stale counts", async () => {
  localStorage.clear();

  // 1. Series should immediately return undefined without fetching stream
  const seriesMeta = await ensureCollectionMetadata(
    "https://www.bilibili.com/medialist/play/546195?business=space_series&business_id=999",
    "My Series",
    [{ url: "https://www.bilibili.com/video/BV1test" }],
  );
  expect(seriesMeta).toBeUndefined();

  // Seed legacy cache missing episodes for business_id=200
  localStorage.setItem(
    "typetype:subscribed-collections-meta",
    JSON.stringify({
      "https://www.bilibili.com/medialist/play/546195?business=space_collection&business_id=200": {
        id: "https://www.bilibili.com/medialist/play/546195?business=space_collection&business_id=200",
        title: "Course",
        sourceCollectionId: "200",
        sections: [
          { id: "sec2", title: "Section 2", videoUrls: ["https://www.bilibili.com/video/BV2"] },
        ],
      },
    }),
  );

  // 2. Collection ID matching should beat earlier substring title match, and backfill episodes
  const originalFetch = globalThis.fetch;
  let fetchCalls = 0;
  let remoteEpisodeCount = 2;

  globalThis.fetch = (async () => {
    fetchCalls += 1;
    const episodes =
      remoteEpisodeCount === 3
        ? [
            { videoId: "BV2", title: "Ep2", url: "https://www.bilibili.com/video/BV2" },
            { videoId: "BV3", title: "Ep3", url: "https://www.bilibili.com/video/BV3" },
            { videoId: "BV4", title: "Ep4", url: "https://www.bilibili.com/video/BV4" },
          ]
        : [
            { videoId: "BV2", title: "Ep2", url: "https://www.bilibili.com/video/BV2" },
            { videoId: "BV3", title: "Ep3", url: "https://www.bilibili.com/video/BV3" },
          ];

    return new Response(
      JSON.stringify({
        id: "BV1test",
        title: "Test Video",
        collections: [
          {
            id: "100",
            title: "Course Advanced",
            sections: [
              {
                id: "sec1",
                title: "Section 1",
                episodes: [
                  { videoId: "BV1", title: "Ep1", url: "https://www.bilibili.com/video/BV1" },
                ],
              },
            ],
          },
          {
            id: "200",
            title: "Other Title",
            sections: [
              {
                id: "sec2",
                title: "Section 2",
                episodes,
              },
            ],
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as unknown as typeof fetch;

  try {
    // Even though collection 100 has "Course" in its title, business_id=200 MUST match id "200" strictly
    const matchedMeta = await ensureCollectionMetadata(
      "https://www.bilibili.com/medialist/play/546195?business=space_collection&business_id=200",
      "Course",
      [{ url: "https://www.bilibili.com/video/BV1test" }],
      2,
    );
    expect(fetchCalls).toBe(1);
    expect(matchedMeta).toBeDefined();
    expect(matchedMeta?.sourceCollectionId).toBe("200");
    expect(matchedMeta?.sections).toHaveLength(1);
    expect(matchedMeta?.sections?.[0].episodes).toHaveLength(2);

    // Matching count hits cache without fetching again
    const cachedMeta = await ensureCollectionMetadata(
      "https://www.bilibili.com/medialist/play/546195?business=space_collection&business_id=200",
      "Course",
      [{ url: "https://www.bilibili.com/video/BV1test" }],
      2,
    );
    expect(fetchCalls).toBe(1);
    expect(cachedMeta?.sections?.[0].episodes).toHaveLength(2);

    // Changed expectedStreamCount (3 != 2) triggers refresh
    remoteEpisodeCount = 3;
    const refreshedMeta = await ensureCollectionMetadata(
      "https://www.bilibili.com/medialist/play/546195?business=space_collection&business_id=200",
      "Course",
      [{ url: "https://www.bilibili.com/video/BV1test" }],
      3,
    );
    expect(fetchCalls).toBe(2);
    expect(refreshedMeta?.sections?.[0].episodes).toHaveLength(3);

    // Unmatched ID + unmatched title returns undefined
    const unmatchedMeta = await ensureCollectionMetadata(
      "https://www.bilibili.com/medialist/play/546195?business=space_collection&business_id=300",
      "Nonexistent",
      [{ url: "https://www.bilibili.com/video/BV1test" }],
    );
    expect(unmatchedMeta).toBeUndefined();
  } finally {
    globalThis.fetch = originalFetch;
    localStorage.clear();
  }
});
