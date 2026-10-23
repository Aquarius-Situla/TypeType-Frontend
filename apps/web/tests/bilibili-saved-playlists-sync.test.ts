import { beforeEach, describe, expect, test } from "bun:test";

let store: Record<string, string> = {};

const mockStorage = {
  getItem: (key: string) => store[key] ?? null,
  setItem: (key: string, value: string) => {
    store[key] = value;
  },
  removeItem: (key: string) => {
    delete store[key];
  },
  clear: () => {
    store = {};
  },
};

if (!("localStorage" in globalThis)) {
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: mockStorage,
  });
} else {
  globalThis.localStorage.getItem = mockStorage.getItem;
  globalThis.localStorage.setItem = mockStorage.setItem;
  globalThis.localStorage.removeItem = mockStorage.removeItem;
  globalThis.localStorage.clear = mockStorage.clear;
}

const {
  getBilibiliSavedPlaylists,
  isBilibiliSavedPlaylist,
  removeBilibiliPlaylistLocally,
  saveBilibiliPlaylistLocally,
} = await import("../src/lib/bilibili-saved-playlists");

import type { SavedPlaylistItem } from "../src/types/playlist";

describe("bilibili saved playlists local storage and sync helper", () => {
  beforeEach(() => {
    store = {};
    if (globalThis.localStorage) {
      globalThis.localStorage.getItem = mockStorage.getItem;
      globalThis.localStorage.setItem = mockStorage.setItem;
      globalThis.localStorage.removeItem = mockStorage.removeItem;
      globalThis.localStorage.clear = mockStorage.clear;
    }
  });

  test("identifies Bilibili saved playlists by various schemes", () => {
    expect(isBilibiliSavedPlaylist("bilibili:season:123:456")).toBe(true);
    expect(isBilibiliSavedPlaylist("season:123:456")).toBe(true);
    expect(isBilibiliSavedPlaylist("series:123:456")).toBe(true);
    expect(
      isBilibiliSavedPlaylist("https://space.bilibili.com/123/channel/collectiondetail?sid=456"),
    ).toBe(true);
    expect(isBilibiliSavedPlaylist("PL123456")).toBe(false);
  });

  test("saves and retrieves playlists locally", () => {
    const item: SavedPlaylistItem = {
      id: "season:123:456",
      publicPlaylistId: "season:123:456",
      url: "https://www.bilibili.com/medialist/play/123?business=space_collection&business_id=456",
      title: "Test Collection",
      thumbnailUrl: "",
      uploaderName: "Test UP",
      streamCount: 5,
      playlistType: "collection",
      savedAt: Date.now(),
    };

    saveBilibiliPlaylistLocally(item);
    const saved = getBilibiliSavedPlaylists();
    expect(saved).toHaveLength(1);
    expect(saved[0]?.title).toBe("Test Collection");
  });

  test("removes playlists locally by id, url, or matching params", () => {
    const item: SavedPlaylistItem = {
      id: "bilibili:season:123:456",
      publicPlaylistId: "bilibili:season:123:456",
      url: "https://www.bilibili.com/medialist/play/123?business=space_collection&business_id=456",
      title: "Test Collection",
      thumbnailUrl: "",
      uploaderName: "Test UP",
      streamCount: 5,
      playlistType: "collection",
      savedAt: Date.now(),
    };

    saveBilibiliPlaylistLocally(item);
    expect(getBilibiliSavedPlaylists()).toHaveLength(1);

    // Remove by season:123:456
    const removed = removeBilibiliPlaylistLocally("season:123:456");
    expect(removed).toBe(true);
    expect(getBilibiliSavedPlaylists()).toHaveLength(0);
  });
});
