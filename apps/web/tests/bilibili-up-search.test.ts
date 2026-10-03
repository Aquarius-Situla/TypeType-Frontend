import { describe, expect, test } from "bun:test";
import {
  canonicalChannelSourceUrl,
  channelRoutePath,
  toCanonicalChannelRoute,
} from "../src/lib/channel-route-url";
import { searchFilterLabel } from "../src/lib/search-filter-selection";

describe("bilibili channel routes and search integration", () => {
  test("resolves canonical channel routes from space URLs with or without protocol", () => {
    expect(toCanonicalChannelRoute("https://space.bilibili.com/946974")).toEqual({
      provider: "bilibili",
      id: "946974",
    });
    expect(toCanonicalChannelRoute("space.bilibili.com/946974")).toEqual({
      provider: "bilibili",
      id: "946974",
    });
    expect(toCanonicalChannelRoute("https://www.bilibili.com/space/946974")).toEqual({
      provider: "bilibili",
      id: "946974",
    });
    expect(toCanonicalChannelRoute("bilibili.com/space/946974")).toEqual({
      provider: "bilibili",
      id: "946974",
    });
  });

  test("generates correct channel route path and canonical source url", () => {
    const route = toCanonicalChannelRoute("https://space.bilibili.com/1792712");
    expect(route).toEqual({ provider: "bilibili", id: "1792712" });
    if (!route) {
      throw new Error("route must be defined");
    }
    expect(canonicalChannelSourceUrl(route)).toBe("https://space.bilibili.com/1792712");
    expect(channelRoutePath("https://space.bilibili.com/1792712")).toBe(
      "/channel/bilibili/1792712",
    );
  });

  test("matches direct UID search pattern for Bilibili UP spaces", () => {
    const uidPattern = /^uid[:：\s]+(\d{1,20})$/i;
    expect("uid:946974".match(uidPattern)?.[1]).toBe("946974");
    expect("UID: 1792712".match(uidPattern)?.[1]).toBe("1792712");
    expect("uid：3546857915550439".match(uidPattern)?.[1]).toBe("3546857915550439");
    expect("uid:notanumber".match(uidPattern)).toBeNull();
  });

  test("formats content filter labels cleanly", () => {
    expect(searchFilterLabel("channels")).toBe("Channels");
    expect(searchFilterLabel("lives")).toBe("Live");
    expect(searchFilterLabel("videos")).toBe("Videos");
    expect(searchFilterLabel("animes")).toBe("Anime");
    expect(searchFilterLabel("movies_and_tv")).toBe("Movies & TV");
  });
});
