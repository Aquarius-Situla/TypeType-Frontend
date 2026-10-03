import { expect, test } from "bun:test";
import {
  channelMembershipChanges,
  clearMembershipChanges,
  subscriptionFilterParams,
} from "../src/lib/subscription-group-selection";
import type { GroupedSubscription } from "../src/types/subscription-groups";

const channels: GroupedSubscription[] = [
  {
    channelUrl: "https://youtube.com/channel/one",
    name: "One",
    avatarUrl: "",
    subscribedAt: 0,
    groupIds: ["tech", "music"],
  },
  {
    channelUrl: "https://youtube.com/channel/two",
    name: "Two",
    avatarUrl: "",
    subscribedAt: 0,
    groupIds: ["music"],
  },
  {
    channelUrl: "https://youtube.com/channel/three",
    name: "Three",
    avatarUrl: "",
    subscribedAt: 0,
    groupIds: [],
  },
];
test("inline save sends only the membership difference", () => {
  expect(channelMembershipChanges(channels[0], new Set(["music", "science"]))).toEqual([
    { groupId: "science", channelUrls: [channels[0].channelUrl], action: "add" },
    { groupId: "tech", channelUrls: [channels[0].channelUrl], action: "remove" },
  ]);
  expect(channelMembershipChanges(channels[0], new Set(channels[0].groupIds))).toEqual([]);
});

test("remove all groups targets only selected channel memberships", () => {
  expect(clearMembershipChanges([channels[1], channels[2]])).toEqual([
    { groupId: "music", channelUrls: [channels[1].channelUrl], action: "remove" },
  ]);
});

test("feed and subscription filters match the server contract", () => {
  expect(subscriptionFilterParams("all").toString()).toBe("");
  expect(subscriptionFilterParams("ungrouped").toString()).toBe("ungrouped=true");
  expect(subscriptionFilterParams("tech").toString()).toBe("groupId=tech");
});
