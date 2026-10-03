import { describe, expect, test } from "bun:test";
import {
  canonicalChannelSourceUrl,
  channelRoutePath,
  toCanonicalChannelRoute,
  toChannelPathParam,
} from "../src/lib/channel-route-url";
import { buildChannelRequestUrl } from "../src/lib/channel-search-url";

describe("channel route URLs", () => {
  test("canonicalizes YouTube channel ids", () => {
    const sourceUrl = "https://www.youtube.com/channel/UC1234567890123456789012";
    expect(toChannelPathParam(sourceUrl)).toBe("UC1234567890123456789012");
    expect(toCanonicalChannelRoute(sourceUrl)).toEqual({
      provider: "youtube",
      id: "UC1234567890123456789012",
    });
    expect(channelRoutePath(sourceUrl)).toBe("/channel/youtube/UC1234567890123456789012");
    expect(canonicalChannelSourceUrl({ provider: "youtube", id: "UC1234567890123456789012" })).toBe(
      "https://www.youtube.com/channel/UC1234567890123456789012",
    );
  });

  test("canonicalizes YouTube handles", () => {
    const sourceUrl = "https://www.youtube.com/@test";
    expect(toCanonicalChannelRoute(sourceUrl)).toEqual({ provider: "youtube", id: "@test" });
    expect(channelRoutePath(sourceUrl)).toBe("/channel/youtube/@test");
    expect(canonicalChannelSourceUrl({ provider: "youtube", id: "@test" })).toBe(
      "https://www.youtube.com/@test",
    );
  });

  test("canonicalizes BiliBili space URLs", () => {
    const sourceUrl = "https://space.bilibili.com/12434430?spm_id_from=tracking";
    expect(toCanonicalChannelRoute(sourceUrl)).toEqual({ provider: "bilibili", id: "12434430" });
    expect(channelRoutePath(sourceUrl)).toBe("/channel/bilibili/12434430");
    expect(canonicalChannelSourceUrl({ provider: "bilibili", id: "12434430" })).toBe(
      "https://space.bilibili.com/12434430",
    );
  });

  test("canonicalizes NicoNico user URLs", () => {
    const sourceUrl = "https://www.nicovideo.jp/user/3343223";
    expect(toCanonicalChannelRoute(sourceUrl)).toEqual({ provider: "niconico", id: "3343223" });
    expect(channelRoutePath(sourceUrl)).toBe("/channel/niconico/3343223");
    expect(canonicalChannelSourceUrl({ provider: "niconico", id: "3343223" })).toBe(
      "https://www.nicovideo.jp/user/3343223",
    );
  });

  test("builds the NicoNico livestream tab URL", () => {
    expect(buildChannelRequestUrl("https://www.nicovideo.jp/user/3343223", "", true)).toBe(
      "https://www.nicovideo.jp/user/3343223/livestreams",
    );
  });

  test("rejects invalid provider route values", () => {
    expect(canonicalChannelSourceUrl({ provider: "youtube", id: "UCRC6cNamj9tYAO6h_RXd5xA" })).toBe(
      "https://www.youtube.com/channel/UCRC6cNamj9tYAO6h_RXd5xA",
    );
    expect(toCanonicalChannelRoute("https://space.bilibili.com/not-a-number")).toBeNull();
    expect(toCanonicalChannelRoute("https://www.nicovideo.jp/video/3343223")).toBeNull();
    expect(canonicalChannelSourceUrl({ provider: "bilibili", id: "not-a-number" })).toBeNull();
  });
});
