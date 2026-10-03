import type {
  NotificationsPage,
  ReadAllNotificationsResponse,
  UnreadNotificationsCount,
} from "../types/notifications";
import { authedJson } from "./authed";
import { API_BASE as BASE } from "./env";

export type ChannelNotificationPreference = {
  channelUrl: string;
  enabled: boolean;
  updatedAt: number;
};

export function fetchUnreadNotificationsCount(): Promise<UnreadNotificationsCount> {
  return authedJson(`${BASE}/notifications/unread-count`);
}

export function fetchNotifications(
  page: number | string = 0,
  limit = 20,
): Promise<NotificationsPage> {
  const search = new URLSearchParams({ page: String(page), limit: String(limit) });
  return authedJson(`${BASE}/notifications?${search.toString()}`);
}

export function markAllNotificationsRead(): Promise<ReadAllNotificationsResponse> {
  return authedJson(`${BASE}/notifications/read-all`, { method: "POST" });
}

export function fetchChannelNotificationPreferences(): Promise<ChannelNotificationPreference[]> {
  return authedJson(`${BASE}/notifications/channel-preferences`);
}

export function updateChannelNotificationPreference(
  channelUrl: string,
  enabled: boolean,
): Promise<ChannelNotificationPreference> {
  return authedJson(`${BASE}/notifications/channel-preferences`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ channelUrl, enabled }),
  });
}
