import { queryOptions } from "@tanstack/react-query";
import type {
  GroupedSubscription,
  MembershipPage,
  MembershipPageRequest,
} from "../types/subscription-groups";
import { authedJson } from "./authed";
import { API_BASE } from "./env";
import { membershipBatches } from "./membership-batches";
import { subscriptionFilterParams } from "./subscription-group-selection";
import { SUBSCRIPTION_GROUP_MEMBERSHIPS_KEY } from "./subscription-queries";

export function groupMembershipPageOptions(
  profile: string | undefined,
  request: MembershipPageRequest,
): ReturnType<typeof queryOptions<MembershipPage>> {
  return queryOptions<MembershipPage>({
    queryKey: [...SUBSCRIPTION_GROUP_MEMBERSHIPS_KEY, profile, "page", request],
    queryFn: ({ signal }) => {
      const params = subscriptionFilterParams(request.filter);
      params.set("page", String(request.page));
      params.set("limit", String(request.limit));
      if (request.search) params.set("search", request.search);
      if (request.excluded && request.filter !== "all" && request.filter !== "ungrouped")
        params.set("excluded", "true");
      return authedJson(`${API_BASE}/subscriptions/group-memberships/page?${params}`, { signal });
    },
    staleTime: 60_000,
  });
}

export function selectedMembershipOptions(
  profile: string | undefined,
  urls: string[],
): ReturnType<typeof queryOptions<GroupedSubscription[]>> {
  return queryOptions<GroupedSubscription[]>({
    queryKey: [...SUBSCRIPTION_GROUP_MEMBERSHIPS_KEY, profile, "selected", [...urls].sort()],
    queryFn: async ({ signal }) => {
      const { batches, invalid } = membershipBatches(urls);
      if (invalid.length) throw new Error("Invalid selected channel URL");
      const result: GroupedSubscription[] = [];
      for (const channelUrls of batches) {
        result.push(
          ...(await authedJson<GroupedSubscription[]>(
            `${API_BASE}/subscriptions/group-memberships/lookup`,
            {
              method: "POST",
              signal,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ channelUrls }),
            },
          )),
        );
      }
      return result;
    },
    // Revisited selections must refresh before membership actions are enabled.
    staleTime: 0,
  });
}
