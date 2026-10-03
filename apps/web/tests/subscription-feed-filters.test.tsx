import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { proxyImage } from "../src/lib/proxy";
import {
  subscriptionFeedQueryOptions,
  subscriptionsQueryOptions,
} from "../src/lib/subscription-queries";
import { useAuthStore } from "../src/stores/auth-store";
import { readFeed, video } from "./helpers/subscription-feed";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
  for (const client of clients.splice(0)) client.clear();
});

function setup(): QueryClient {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  useAuthStore.getState().setToken("feed-filter-test");
  return client;
}

test("all, named and ungrouped feeds keep separate pages, cursors and avatar sources", async () => {
  const client = setup();
  const calls: Array<{ filter: string; cursor: string | null }> = [];
  const channelUrl = "https://www.youtube.com/channel/shared";
  globalThis.fetch = async (input) => {
    const url = new URL(String(input), "https://fixture.invalid");
    const filter =
      url.searchParams.get("groupId") ??
      (url.searchParams.get("ungrouped") === "true" ? "ungrouped" : "all");
    const cursor = url.searchParams.get("cursor");
    calls.push({ filter, cursor });
    return Response.json({
      videos: [{ ...video(`${filter}-${cursor ? 2 : 1}`), uploaderUrl: channelUrl }],
      nextpage: cursor ? null : `${filter}-cursor`,
    });
  };
  const filters = ["all", "tech", "ungrouped"];
  for (const filter of filters) {
    client.setQueryData(subscriptionsQueryOptions(filter).queryKey, [
      {
        channelUrl,
        name: "Channel",
        avatarUrl: `https://example.org/${filter}.jpg`,
        subscribedAt: 0,
      },
    ]);
    await client.prefetchInfiniteQuery(subscriptionFeedQueryOptions(filter));
  }
  for (const filter of filters) {
    const feed = readFeed(client, filter);
    expect(feed.streams.map((item) => item.title)).toEqual([`${filter}-1`]);
    expect(feed.streams[0].channelAvatar).toBe(proxyImage(`https://example.org/${filter}.jpg`));
  }
  await readFeed(client, "tech").fetchNextPage();
  expect(readFeed(client, "all").streams).toHaveLength(1);
  expect(readFeed(client, "ungrouped").streams).toHaveLength(1);
  await readFeed(client, "ungrouped").fetchNextPage();
  await readFeed(client, "all").fetchNextPage();
  for (const filter of filters) {
    expect(calls.filter((call) => call.filter === filter).map((call) => call.cursor)).toEqual([
      null,
      `${filter}-cursor`,
    ]);
    expect(readFeed(client, filter).streams.map((item) => item.title)).toEqual([
      `${filter}-1`,
      `${filter}-2`,
    ]);
  }
});

test("a named feed reuses filtered subscriptions without creating an unfiltered query", () => {
  const client = setup();
  client.setQueryData(subscriptionsQueryOptions("tech").queryKey, []);
  expect(readFeed(client, "tech").isLoading).toBe(false);
  expect(client.getQueryState(subscriptionsQueryOptions().queryKey)).toBeUndefined();
});

test("empty subscriptions suppress cached feed cards and loading or pagination states", () => {
  const client = setup();
  client.setQueryData(subscriptionsQueryOptions().queryKey, []);
  client.setQueryData(subscriptionFeedQueryOptions().queryKey, {
    pages: [{ videos: [video("old")], nextpage: "old-cursor" }],
    pageParams: [null],
  });
  const feed = readFeed(client);
  expect(feed.streams).toEqual([]);
  expect(feed.isLoading).toBe(false);
  expect(feed.isLoadingError).toBe(false);
  expect(feed.hasNextPage).toBe(false);
});
