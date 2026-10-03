import {
  type InfiniteData,
  infiniteQueryOptions,
  type QueryClient,
  queryOptions,
} from "@tanstack/react-query";
import type { SubscriptionFeedPage } from "../types/api";
import type { SubscriptionItem } from "../types/user";
import { fetchSubscriptionFeed, fetchSubscriptions } from "./api-user";

const SUBSCRIPTIONS_KEY = ["subscriptions"];
export const SUBSCRIPTION_FEED_KEY = ["subscription-feed"];
export const SUBSCRIPTION_GROUPS_KEY = ["subscription-groups"];
export const SUBSCRIPTION_GROUP_MEMBERSHIPS_KEY = ["subscription-group-memberships"];
const SUBSCRIPTION_STALE_MS = 5 * 60 * 1000;

export function subscriptionsQueryOptions(
  filter = "all",
): ReturnType<typeof queryOptions<SubscriptionItem[]>> {
  return queryOptions<SubscriptionItem[]>({
    queryKey: filter === "all" ? SUBSCRIPTIONS_KEY : [...SUBSCRIPTIONS_KEY, filter],
    queryFn: ({ signal }) => fetchSubscriptions(filter, signal),
    staleTime: SUBSCRIPTION_STALE_MS,
  });
}

export function subscriptionFeedQueryOptions(
  filter = "all",
): ReturnType<
  typeof infiniteQueryOptions<
    SubscriptionFeedPage,
    Error,
    InfiniteData<SubscriptionFeedPage>,
    string[],
    string | null
  >
> {
  return infiniteQueryOptions({
    queryKey: filter === "all" ? SUBSCRIPTION_FEED_KEY : [...SUBSCRIPTION_FEED_KEY, filter],
    queryFn: ({ pageParam, signal }) => fetchSubscriptionFeed(pageParam, signal, filter),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextpage ?? undefined,
    staleTime: SUBSCRIPTION_STALE_MS,
  });
}

export async function invalidateSubscriptionQueries(
  client: QueryClient,
  change: "subscriptions" | "groups" | "memberships" = "subscriptions",
): Promise<void> {
  const keys =
    change === "groups"
      ? [SUBSCRIPTION_GROUPS_KEY]
      : [
          SUBSCRIPTIONS_KEY,
          SUBSCRIPTION_FEED_KEY,
          SUBSCRIPTION_GROUPS_KEY,
          SUBSCRIPTION_GROUP_MEMBERSHIPS_KEY,
        ];
  await Promise.all(
    keys.map((queryKey) => {
      const deferred =
        change === "memberships" &&
        (queryKey === SUBSCRIPTIONS_KEY || queryKey === SUBSCRIPTION_FEED_KEY);
      // Membership edits leave global views unchanged; filtered views refresh when opened.
      return client.invalidateQueries({
        queryKey,
        refetchType: deferred ? "none" : "active",
        predicate: (query) => !deferred || query.queryKey.length > 1,
      });
    }),
  );
}
