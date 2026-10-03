import { afterEach, expect, test } from "bun:test";
import { InfiniteQueryObserver, QueryClient } from "@tanstack/react-query";
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

function setup(filter = "all") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  client.setQueryData(subscriptionsQueryOptions(filter).queryKey, [
    {
      channelUrl: "https://example.org/channel",
      name: "Test channel",
      avatarUrl: "",
      subscribedAt: 0,
    },
  ]);
  useAuthStore.getState().setToken("feed-error-test");
  const observer = new InfiniteQueryObserver(client, subscriptionFeedQueryOptions(filter));
  return { client, observer };
}

test("a failed next page preserves videos and retries the same cursor", async () => {
  const { client, observer } = setup();
  let failNext = true;
  const cursors: Array<string | null> = [];
  globalThis.fetch = async (input) => {
    const cursor = new URL(String(input), "https://fixture.invalid").searchParams.get("cursor");
    cursors.push(cursor);
    if (cursor && failNext) return Response.json({ error: "Unavailable" }, { status: 503 });
    return Response.json({
      videos: [video(cursor ? "second" : "first")],
      nextpage: cursor ? null : "page-2",
    });
  };
  await observer.refetch();
  await observer.fetchNextPage();
  const failed = readFeed(client);
  expect(failed.streams.map((item) => item.title)).toEqual(["first"]);
  expect(failed.isLoadingError).toBe(false);
  expect(failed.isFetchNextPageError).toBe(true);
  expect(failed.hasNextPage).toBe(true);

  failNext = false;
  await failed.fetchNextPage();
  const recovered = readFeed(client);
  expect(recovered.streams.map((item) => item.title)).toEqual(["first", "second"]);
  expect(recovered.isFetchNextPageError).toBe(false);
  expect(recovered.hasNextPage).toBe(false);
  expect(cursors).toEqual([null, "page-2", "page-2"]);
});

test("an initial-load failure exposes recovery without a pagination error", async () => {
  const { client, observer } = setup();
  globalThis.fetch = async () => Response.json({ error: "Unavailable" }, { status: 503 });
  await observer.refetch();
  const failed = readFeed(client);
  expect(failed.isLoadingError).toBe(true);
  expect(failed.isFetchNextPageError).toBe(false);
  expect(failed.streams).toEqual([]);
  globalThis.fetch = async () => Response.json({ videos: [video("first")], nextpage: null });
  await failed.refetch();
  expect(readFeed(client).isLoadingError).toBe(false);
});

test("a failed background refresh retains cached feed content", async () => {
  const { client, observer } = setup();
  globalThis.fetch = async () => Response.json({ videos: [video("first")], nextpage: null });
  await observer.refetch();
  globalThis.fetch = async () => Response.json({ error: "Unavailable" }, { status: 503 });
  await observer.refetch();
  const failed = readFeed(client);
  expect(failed.isLoadingError).toBe(false);
  expect(failed.isFetchNextPageError).toBe(false);
  expect(failed.streams.map((item) => item.title)).toEqual(["first"]);
});

test("a prefetched filtered feed is reused and keeps its filter when fetching another page", async () => {
  const filter = "tech & science/#";
  const { client } = setup(filter);
  const calls: URL[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input), "https://fixture.invalid");
    calls.push(url);
    const cursor = url.searchParams.get("cursor");
    return Response.json({
      videos: [video(cursor ? "second" : "first")],
      nextpage: cursor ? null : "page-2",
    });
  };
  await client.prefetchInfiniteQuery(subscriptionFeedQueryOptions(filter));
  const feed = readFeed(client, filter);
  expect(feed.streams.map((item) => item.title)).toEqual(["first"]);
  expect(calls).toHaveLength(1);
  await feed.fetchNextPage();
  expect(readFeed(client, filter).streams.map((item) => item.title)).toEqual(["first", "second"]);
  expect(calls.map((url) => url.searchParams.get("cursor"))).toEqual([null, "page-2"]);
  expect(calls.every((url) => url.searchParams.get("groupId") === filter)).toBe(true);
});
