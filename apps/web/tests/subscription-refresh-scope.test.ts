import { afterEach, expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { invalidateSubscriptionQueries } from "../src/lib/subscription-queries";

const cleanups: Array<() => void> = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  const reads: string[] = [];
  const keys = [
    ["subscription-groups", "profile"],
    ["subscription-group-memberships", "profile"],
    ["subscriptions"],
    ["subscriptions", "tech"],
    ["subscriptions", "ungrouped"],
    ["subscription-feed"],
    ["subscription-feed", "tech"],
    ["subscription-feed", "ungrouped"],
  ];
  for (const queryKey of keys) {
    client.setQueryData(queryKey, ["cached"]);
    const observer = new QueryObserver(client, {
      queryKey,
      queryFn: async () => {
        reads.push(queryKey.join("/"));
        return ["fresh"];
      },
    });
    cleanups.push(observer.subscribe(() => {}));
  }
  cleanups.push(() => client.clear());
  return { client, reads };
}

test("membership saves refresh manager reads and defer filtered views without touching global views", async () => {
  const { client, reads } = setup();
  await invalidateSubscriptionQueries(client, "memberships");
  expect(reads.sort()).toEqual([
    "subscription-group-memberships/profile",
    "subscription-groups/profile",
  ]);
  for (const family of ["subscriptions", "subscription-feed"]) {
    expect(client.getQueryState([family])?.isInvalidated).toBe(false);
    for (const filter of ["tech", "ungrouped"]) {
      expect(client.getQueryState([family, filter])?.isInvalidated).toBe(true);
      expect(client.getQueryData([family, filter])).toEqual(["cached"]);
    }
  }
});

test("creating or renaming a group refreshes only group definitions", async () => {
  const { client, reads } = setup();
  await invalidateSubscriptionQueries(client, "groups");
  expect(reads).toEqual(["subscription-groups/profile"]);
  expect(client.getQueryState(["subscription-group-memberships", "profile"])?.isInvalidated).toBe(
    false,
  );
});
