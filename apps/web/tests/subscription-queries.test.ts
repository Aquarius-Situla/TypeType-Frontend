import { afterEach, expect, test } from "bun:test";
import { QueryClient } from "@tanstack/react-query";
import { fetchSubscriptions } from "../src/lib/api-user";
import {
  invalidateSubscriptionQueries,
  subscriptionsQueryOptions,
} from "../src/lib/subscription-queries";
import { useAuthStore } from "../src/stores/auth-store";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
  for (const client of clients.splice(0)) client.clear();
});

test("channel prefetches stay distinct by filter and are reused by subsequent reads", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(client);
  useAuthStore.getState().setToken("subscription-query-test");
  const calls: string[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input), "https://fixture.invalid");
    calls.push(url.pathname + url.search);
    const name =
      url.searchParams.get("groupId") ?? (url.searchParams.has("ungrouped") ? "ungrouped" : "all");
    return Response.json([{ channelUrl: name, name, avatarUrl: "", subscribedAt: 0 }]);
  };
  for (const filter of ["all", "ungrouped", "tech & science/#"]) {
    const options = subscriptionsQueryOptions(filter);
    await client.prefetchQuery(options);
    expect((await client.fetchQuery(options))[0].name).toBe(filter);
  }
  expect(calls).toEqual([
    "/api/subscriptions",
    "/api/subscriptions?ungrouped=true",
    "/api/subscriptions?groupId=tech+%26+science%2F%23",
  ]);
  expect((await fetchSubscriptions())[0].name).toBe("all");
  expect(calls.at(-1)).toBe("/api/subscriptions");
});

test("subscription changes invalidate every filter and profile variant without clearing data", async () => {
  const client = new QueryClient();
  clients.push(client);
  const affectedKeys = [
    ["subscriptions"],
    ["subscriptions", "tech"],
    ["subscriptions", "ungrouped"],
    ["subscription-feed"],
    ["subscription-feed", "tech"],
    ["subscription-groups", "profile"],
    ["subscription-group-memberships", "profile"],
  ];
  for (const key of [...affectedKeys, ["playlists"]]) client.setQueryData(key, ["cached"]);
  await invalidateSubscriptionQueries(client);
  for (const key of affectedKeys) {
    expect(client.getQueryState(key)?.isInvalidated).toBe(true);
    expect(client.getQueryData(key)).toEqual(["cached"]);
  }
  expect(client.getQueryState(["playlists"])?.isInvalidated).toBe(false);
});
