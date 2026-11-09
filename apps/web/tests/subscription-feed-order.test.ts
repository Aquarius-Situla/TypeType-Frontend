import { expect, test } from "bun:test";
import {
  SUBSCRIPTION_FEED_KEY,
  subscriptionFeedQueryOptions,
} from "../src/lib/subscription-queries";

test("keeps the newest feed on its existing cache key and gives the oldest order its own", () => {
  expect(subscriptionFeedQueryOptions().queryKey).toEqual(SUBSCRIPTION_FEED_KEY);
  expect(subscriptionFeedQueryOptions("ungrouped").queryKey).toEqual([
    ...SUBSCRIPTION_FEED_KEY,
    "ungrouped",
  ]);
  expect(subscriptionFeedQueryOptions("all", "oldest").queryKey).toEqual([
    ...SUBSCRIPTION_FEED_KEY,
    "all",
    "oldest",
  ]);
  expect(subscriptionFeedQueryOptions("ungrouped", "oldest").queryKey).toEqual([
    ...SUBSCRIPTION_FEED_KEY,
    "ungrouped",
    "oldest",
  ]);
});
