import type { NotificationItem, SubscriptionNewVideoNotification } from "../types/notifications";

export type NotificationToastCursor = {
  latestCreatedAt: number;
  keysAtLatest: string[];
};

export function notificationKey(item: NotificationItem): string {
  if (item.type === "twitch_live_started") return `${item.type}:${item.live.streamId}`;
  return `${item.type}:${item.video.url.trim() || item.video.id}`;
}

export function createNotificationToastCursor(
  items: NotificationItem[],
  emptyBaseline: number,
): NotificationToastCursor {
  const latestCreatedAt = items.reduce(
    (latest, item) => Math.max(latest, item.createdAt),
    Number.NEGATIVE_INFINITY,
  );
  if (!Number.isFinite(latestCreatedAt)) {
    return { latestCreatedAt: emptyBaseline, keysAtLatest: [] };
  }
  return {
    latestCreatedAt,
    keysAtLatest: items.filter((item) => item.createdAt === latestCreatedAt).map(notificationKey),
  };
}

export function findNewNotificationItems(
  items: NotificationItem[],
  cursor: NotificationToastCursor,
): NotificationItem[] {
  const knownAtLatest = new Set(cursor.keysAtLatest);
  return items.filter(
    (item) =>
      item.createdAt > cursor.latestCreatedAt ||
      (item.createdAt === cursor.latestCreatedAt && !knownAtLatest.has(notificationKey(item))),
  );
}

export function visibleNotificationToastItems(
  items: NotificationItem[],
  popupsEnabled: boolean,
  isHidden: (video: SubscriptionNewVideoNotification["video"]) => boolean,
): NotificationItem[] {
  if (!popupsEnabled) return [];
  return items.filter((item) => item.type !== "subscription_new_video" || !isHidden(item.video));
}

export function advanceNotificationToastCursor(
  cursor: NotificationToastCursor,
  items: NotificationItem[],
): NotificationToastCursor {
  const candidate = createNotificationToastCursor(items, cursor.latestCreatedAt);
  if (candidate.latestCreatedAt < cursor.latestCreatedAt) return cursor;
  if (candidate.latestCreatedAt > cursor.latestCreatedAt) return candidate;
  return {
    latestCreatedAt: cursor.latestCreatedAt,
    keysAtLatest: [...new Set([...cursor.keysAtLatest, ...candidate.keysAtLatest])],
  };
}

export function parseNotificationToastCursor(value: unknown): NotificationToastCursor | null {
  if (typeof value !== "object" || value === null) return null;
  const candidate = value as Partial<NotificationToastCursor>;
  if (!Number.isFinite(candidate.latestCreatedAt)) return null;
  if (!Array.isArray(candidate.keysAtLatest)) return null;
  if (!candidate.keysAtLatest.every((key) => typeof key === "string")) return null;
  return {
    latestCreatedAt: candidate.latestCreatedAt as number,
    keysAtLatest: [...new Set(candidate.keysAtLatest)],
  };
}
