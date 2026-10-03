import { afterEach, expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import {
  groupMembershipPageOptions,
  selectedMembershipOptions,
} from "../src/lib/group-membership-queries";
import { clearMembershipChanges } from "../src/lib/subscription-group-selection";
import { useAuthStore } from "../src/stores/auth-store";
import type { GroupedSubscription } from "../src/types/subscription-groups";

const originalFetch = globalThis.fetch;
const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
  globalThis.fetch = originalFetch;
  useAuthStore.getState().setSignedOut();
});

test("reselecting a cached channel refreshes memberships before removing all groups", async () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  cleanups.push(() => cache.clear());
  useAuthStore.getState().setToken("selection-refresh-test");
  const channel: GroupedSubscription = {
    channelUrl: "https://example.com/channel/selected",
    name: "Selected channel",
    avatarUrl: "",
    subscribedAt: 0,
    groupIds: [],
  };
  let current = channel;
  let lookups = 0;
  const refresh = Promise.withResolvers<Response>();
  globalThis.fetch = async (input) => {
    if (String(input).includes("/lookup")) {
      lookups++;
      return lookups === 1 ? Response.json([current]) : refresh.promise;
    }
    return Response.json({
      items: [current],
      total: 1,
      totalSubscriptions: 1,
      ungroupedCount: 0,
      page: 0,
      limit: 10,
    });
  };
  const selected = selectedMembershipOptions("profile", [channel.channelUrl]);
  await cache.fetchQuery(selected);
  const observer = new QueryObserver(cache, {
    ...selectedMembershipOptions("profile", []),
    enabled: false,
    initialData: [],
  });
  cleanups.unshift(observer.subscribe(() => {}));

  current = { ...channel, groupIds: ["tech"] };
  const page = await cache.fetchQuery(
    groupMembershipPageOptions("profile", {
      page: 0,
      limit: 10,
      filter: "all",
      excluded: false,
      search: channel.channelUrl,
    }),
  );
  expect(page.items[0].groupIds).toEqual(["tech"]);
  observer.setOptions({
    ...selected,
    enabled: true,
    initialData: page.items,
    initialDataUpdatedAt: 0,
  });
  expect(lookups).toBe(2);
  expect(observer.getCurrentResult().isFetching).toBe(true);

  const refreshed = cache.fetchQuery(selected);
  refresh.resolve(Response.json([current]));
  await refreshed;
  const result = observer.getCurrentResult();
  expect(result.isFetching).toBe(false);
  expect(clearMembershipChanges(result.data ?? [])).toEqual([
    { groupId: "tech", channelUrls: [channel.channelUrl], action: "remove" },
  ]);
});
