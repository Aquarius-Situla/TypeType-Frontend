import type { SubscriptionItem } from "./user";

export type SubscriptionGroup = {
  id: string;
  name: string;
  channelCount: number;
  createdAt: number;
  updatedAt: number;
};

export type GroupedSubscription = SubscriptionItem & { groupIds: string[] };
export type MembershipPage = {
  items: GroupedSubscription[];
  total: number;
  totalSubscriptions: number;
  ungroupedCount: number;
  page: number;
  limit: number;
};
export type MembershipPageRequest = {
  page: number;
  limit: number;
  filter: string;
  search: string;
  excluded: boolean;
};
export type MembershipChange = {
  groupId: string;
  channelUrls: string[];
  action: "add" | "remove";
};
