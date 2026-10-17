import { afterEach, describe, expect, mock, test } from "bun:test";
import {
  extractBilibiliChannelMid,
  fetchBilibiliChannelMeta,
  isBilibiliCollectionUrl,
  parseBilibiliCollectionParams,
} from "../src/lib/api-bilibili-channel-collections";
import { useAuthStore } from "../src/stores/auth-store";

const originalFetch = globalThis.fetch;
const originalToken = useAuthStore.getState().token;

afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.setState({ token: originalToken });
});

test("does not send the TypeType bearer token to the Bilibili proxy", async () => {
  useAuthStore.setState({ token: "test-token" });
  const fetchMock = mock(async () =>
    Response.json({ code: 0, data: { card: { name: "Test" } } }),
  );
  globalThis.fetch = fetchMock;

  await fetchBilibiliChannelMeta("546195");

  const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
  expect(url).toBe("/api/bilibili/x/web-interface/card?mid=546195");
  expect(new Headers(init?.headers).has("Authorization")).toBe(false);
});

describe("bilibili channel and collection url parser", () => {
  test("extracts MID from various space URLs and pure numeric IDs", () => {
    expect(extractBilibiliChannelMid("546195")).toBe("546195");
    expect(extractBilibiliChannelMid("https://space.bilibili.com/546195")).toBe("546195");
    expect(extractBilibiliChannelMid("https://space.bilibili.com/546195/video")).toBe("546195");
    expect(extractBilibiliChannelMid("https://www.bilibili.com/space/546195")).toBe("546195");
    expect(extractBilibiliChannelMid("https://youtube.com/@channel")).toBeNull();
  });

  test("identifies Bilibili collection URLs", () => {
    expect(isBilibiliCollectionUrl("bilibili:season:546195:100")).toBe(true);
    expect(isBilibiliCollectionUrl("bilibili:series:546195:200")).toBe(true);
    expect(
      isBilibiliCollectionUrl(
        "https://space.bilibili.com/546195/channel/collectiondetail?sid=123",
      ),
    ).toBe(true);
    expect(
      isBilibiliCollectionUrl(
        "https://space.bilibili.com/546195/channel/seriesdetail?sid=456",
      ),
    ).toBe(true);
    expect(isBilibiliCollectionUrl("https://www.youtube.com/playlist?list=PL123")).toBe(false);
  });

  test("parses season and series collection parameters correctly", () => {
    // Custom protocol
    expect(parseBilibiliCollectionParams("bilibili:season:546195:100")).toEqual({
      kind: "season",
      mid: "546195",
      id: "100",
    });
    expect(parseBilibiliCollectionParams("bilibili:series:546195:200")).toEqual({
      kind: "series",
      mid: "546195",
      id: "200",
    });

    // Space web URLs with mid in path and sid in query
    expect(
      parseBilibiliCollectionParams(
        "https://space.bilibili.com/546195/channel/collectiondetail?sid=123",
      ),
    ).toEqual({
      kind: "season",
      mid: "546195",
      id: "123",
    });
    expect(
      parseBilibiliCollectionParams(
        "https://space.bilibili.com/546195/channel/seriesdetail?sid=456",
      ),
    ).toEqual({
      kind: "series",
      mid: "546195",
      id: "456",
    });

    // Medialist play URLs with query params
    expect(
      parseBilibiliCollectionParams(
        "https://www.bilibili.com/medialist/play/546195?business=space_collection&business_id=123",
      ),
    ).toEqual({
      kind: "season",
      mid: "546195",
      id: "123",
    });
    expect(
      parseBilibiliCollectionParams(
        "https://www.bilibili.com/medialist/play/546195?business=space_series&business_id=456",
      ),
    ).toEqual({
      kind: "series",
      mid: "546195",
      id: "456",
    });
  });
});
