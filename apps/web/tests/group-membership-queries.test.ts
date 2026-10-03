import { afterEach, beforeEach, expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  groupMembershipPageOptions,
  selectedMembershipOptions,
} from "../src/lib/group-membership-queries";
import { invalidateSubscriptionQueries } from "../src/lib/subscription-queries";
import { useAuthStore } from "../src/stores/auth-store";

const originalFetch = globalThis.fetch;
const clients: QueryClient[] = [];
function client(): QueryClient {
  const value = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  clients.push(value);
  return value;
}
beforeEach(() => useAuthStore.getState().setToken("page-test"));
afterEach(() => {
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
  for (const value of clients.splice(0)) value.clear();
});
const request = { page: 1, limit: 7, filter: "tech", excluded: true, search: "A & B" };

test("pages and filters have independent caches and send bounded server parameters", async () => {
  const cache = client();
  const calls: URL[] = [];
  globalThis.fetch = async (input) => {
    const url = new URL(String(input), "https://fixture.test");
    calls.push(url);
    return Response.json({
      items: [],
      total: 1001,
      totalSubscriptions: 1200,
      ungroupedCount: 20,
      page: Number(url.searchParams.get("page")),
      limit: Number(url.searchParams.get("limit")),
    });
  };
  const requests = [
    request,
    { ...request, page: 2 },
    { ...request, filter: "ungrouped", excluded: false },
    { ...request, filter: "all", excluded: false },
  ];
  for (const value of requests)
    await cache.fetchQuery(groupMembershipPageOptions("profile", value));
  await cache.fetchQuery(groupMembershipPageOptions("profile", request));
  expect(calls).toHaveLength(4);
  expect(calls.every((url) => url.pathname === "/api/subscriptions/group-memberships/page")).toBe(
    true,
  );
  expect(Object.fromEntries(calls[0].searchParams)).toEqual({
    page: "1",
    limit: "7",
    groupId: "tech",
    excluded: "true",
    search: "A & B",
  });
  expect(calls[2].searchParams.get("ungrouped")).toBe("true");
  expect(calls[3].searchParams.has("groupId")).toBe(false);
});

test("selection lookup splits large selections, deduplicates URLs and stays account scoped", async () => {
  const cache = client();
  const urls = Array.from({ length: 1201 }, (_, i) => `https://example.com/channel/${i}`);
  const sizes: number[] = [];
  globalThis.fetch = async (input, init) => {
    expect(String(input)).toBe("/api/subscriptions/group-memberships/lookup");
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body));
    sizes.push(body.channelUrls.length);
    return Response.json(
      body.channelUrls.map((channelUrl: string) => ({
        channelUrl,
        name: channelUrl,
        avatarUrl: "",
        subscribedAt: 0,
        groupIds: [],
      })),
    );
  };
  expect(
    await cache.fetchQuery(selectedMembershipOptions("first", [...urls, urls[0]])),
  ).toHaveLength(1201);
  expect(sizes).toEqual([500, 500, 201]);
  expect(cache.getQueryData(selectedMembershipOptions("second", urls).queryKey)).toBeUndefined();
});

test("leaving a page or selection aborts the underlying read", () => {
  for (const options of [
    groupMembershipPageOptions("profile", request),
    selectedMembershipOptions("profile", ["channel"]),
  ]) {
    const cache = client();
    let signal: AbortSignal | null | undefined;
    globalThis.fetch = async (_input, init) => {
      signal = init?.signal;
      return new Promise<Response>((_resolve, reject) =>
        signal?.addEventListener("abort", () => reject(signal?.reason), { once: true }),
      );
    };
    const observer = new QueryObserver(cache, options);
    const stop = observer.subscribe(() => {});
    expect(signal?.aborted).toBe(false);
    stop();
    expect(signal?.aborted).toBe(true);
  }
});

test("membership changes refresh off-page selections and remove unsubscribed channels", async () => {
  const cache = client();
  let present = true;
  let groupIds: string[] = [];
  globalThis.fetch = async () =>
    Response.json(
      present
        ? [{ channelUrl: "off-page", name: "Off page", avatarUrl: "", subscribedAt: 0, groupIds }]
        : [],
    );
  const options = selectedMembershipOptions("profile", ["off-page"]);
  await cache.fetchQuery(options);
  const observer = new QueryObserver(cache, options);
  const stop = observer.subscribe(() => {});
  groupIds = ["tech", "science"];
  await invalidateSubscriptionQueries(cache, "memberships");
  expect(cache.getQueryData(options.queryKey)?.[0].groupIds).toEqual(groupIds);
  present = false;
  await invalidateSubscriptionQueries(cache, "subscriptions");
  expect(cache.getQueryData(options.queryKey)).toEqual([]);
  stop();
});
