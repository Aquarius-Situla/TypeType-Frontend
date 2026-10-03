import { expect, test } from "bun:test";
import { QueryClient, QueryObserver } from "@tanstack/react-query";
import { clearProfileQueries, resetProfileQueries } from "../src/lib/profile-query-cache";

test("refreshes mounted subscriptions without replacing their observer or media cache", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let profile = "Original";
  const observer = new QueryObserver(client, {
    queryKey: ["subscriptions"],
    queryFn: async () => [profile],
    staleTime: Infinity,
  });
  const unsubscribe = observer.subscribe(() => {});
  await observer.refetch();
  const media = { url: "playing-video" };
  client.setQueryData(["stream", "playing-video"], media);
  client.setQueryData(["history"], ["original-video"]);
  client.setQueryData(["subscription-groups", "original-profile"], ["old-group"]);
  client.setQueryData(["subscription-group-memberships", "original-profile"], ["old-membership"]);
  client.setQueryData(["search-panel-videos", 0], ["original-recommendation"]);
  profile = "Test";

  const refresh = resetProfileQueries(client);
  expect(observer.getCurrentResult().data).toBeUndefined();
  expect(client.getQueryData(["history"])).toBeUndefined();
  expect(client.getQueryData(["subscription-groups", "original-profile"])).toBeUndefined();
  expect(
    client.getQueryData(["subscription-group-memberships", "original-profile"]),
  ).toBeUndefined();
  expect(client.getQueryData(["search-panel-videos", 0])).toBeUndefined();
  expect(client.getQueryData(["stream", "playing-video"])).toBe(media);
  await refresh;
  expect(observer.getCurrentResult().data).toEqual(["Test"]);

  unsubscribe();
  client.clear();
});

test("removes profile data on logout without refetching it", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let fetchCount = 0;
  const observer = new QueryObserver(client, {
    queryKey: ["subscriptions"],
    queryFn: async () => {
      fetchCount += 1;
      return ["private-subscription"];
    },
  });
  const unsubscribe = observer.subscribe(() => {});
  await observer.refetch();
  client.setQueryData(["history", ""], ["private-history"]);

  await clearProfileQueries(client);

  expect(client.getQueryData(["subscriptions"])).toBeUndefined();
  expect(client.getQueryData(["history", ""])).toBeUndefined();
  expect(fetchCount).toBe(1);
  const nextObserver = new QueryObserver(client, {
    queryKey: ["subscriptions"],
    queryFn: async () => ["next-user-subscription"],
  });
  expect(nextObserver.getCurrentResult().data).toBeUndefined();
  nextObserver.destroy();
  unsubscribe();
  client.clear();
});

test("ignores an old profile response that arrives after switching", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  let finishOld: (value: string[]) => void = () => {};
  const oldResponse = new Promise<string[]>((resolve) => {
    finishOld = resolve;
  });
  let profile = "Original";
  const observer = new QueryObserver(client, {
    queryKey: ["subscriptions"],
    queryFn: () => (profile === "Original" ? oldResponse : Promise.resolve(["Test"])),
  });
  const unsubscribe = observer.subscribe(() => {});
  profile = "Test";
  await resetProfileQueries(client);
  finishOld(["Original"]);
  await oldResponse;
  expect(observer.getCurrentResult().data).toEqual(["Test"]);
  unsubscribe();
  client.clear();
});
