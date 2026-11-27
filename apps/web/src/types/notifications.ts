import type { VideoItem } from "./api";

export type SubscriptionNewVideoNotification = {
  type: "subscription_new_video";
  title: string;
  publishedAt?: number | null;
  createdAt: number;
  channelUrl: string;
  channelName: string;
  channelAvatarUrl: string;
  serviceId: number;
  serviceName: string;
  video: VideoItem;
};

export type TwitchLiveStartedNotification = {
  type: "twitch_live_started";
  title: string;
  publishedAt?: number | null;
  createdAt: number;
  channelUrl: string;
  channelName: string;
  channelAvatarUrl: string;
  serviceId: number;
  serviceName: string;
  live: { streamId: string; login: string; category: string };
};

export type NotificationItem = SubscriptionNewVideoNotification | TwitchLiveStartedNotification;

export type NotificationsPage = {
  items: NotificationItem[];
  unreadCount: number;
  nextpage: string | null;
  available: boolean;
};

export type ReadAllNotificationsResponse = {
  readAt: number;
  unreadCount: number;
  available: boolean;
};

export type UnreadNotificationsCount = {
  unreadCount: number;
  available: boolean;
};
