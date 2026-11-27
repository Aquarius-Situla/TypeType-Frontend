import { describe, expect, test } from "bun:test";
import {
  advanceNotificationToastCursor,
  createNotificationToastCursor,
  findNewNotificationItems,
  notificationKey,
  parseNotificationToastCursor,
  visibleNotificationToastItems,
} from "../src/lib/notification-toast-cursor";
import type { NotificationItem } from "../src/types/notifications";

function notification(id: string, createdAt: number): NotificationItem {
  return {
    type: "subscription_new_video",
    title: `Channel uploaded ${id}`,
    createdAt,
    publishedAt: createdAt,
    channelUrl: "https://youtube.com/@channel",
    channelName: "Channel",
    channelAvatarUrl: "avatar.jpg",
    video: {
      id,
      title: `Video ${id}`,
      url: `https://youtube.com/watch?v=${id}`,
      thumbnailUrl: "thumbnail.jpg",
      uploaderName: "Channel",
      uploaderUrl: "https://youtube.com/@channel",
      uploaderAvatarUrl: "avatar.jpg",
      uploaderVerified: false,
      duration: 60,
      viewCount: 0,
      publishedAt: createdAt,
      uploadDate: "",
      uploaded: createdAt,
      streamType: "VIDEO_STREAM",
      isLive: false,
      isPostLive: false,
      isLiveContent: false,
      requiresMembership: false,
      isShortFormContent: false,
      shortDescription: null,
    },
  };
}

describe("notification toast cursor", () => {
  test("uses the current newest notification as a silent first baseline", () => {
    expect(
      createNotificationToastCursor([notification("old", 100), notification("latest", 300)], 500),
    ).toEqual({
      latestCreatedAt: 300,
      keysAtLatest: ["subscription_new_video:https://youtube.com/watch?v=latest"],
    });
  });

  test("uses the current time when the first response is empty", () => {
    expect(createNotificationToastCursor([], 500)).toEqual({
      latestCreatedAt: 500,
      keysAtLatest: [],
    });
  });

  test("returns only notifications newer than the stored cursor", () => {
    const cursor = createNotificationToastCursor([notification("seen", 200)], 0);
    expect(
      findNewNotificationItems(
        [notification("newest", 400), notification("new", 300), notification("seen", 200)],
        cursor,
      ).map((item) => item.video.id),
    ).toEqual(["newest", "new"]);
  });

  test("detects a different video published at the same timestamp", () => {
    const cursor = createNotificationToastCursor([notification("seen", 200)], 0);
    const simultaneous = notification("simultaneous", 200);
    expect(findNewNotificationItems([simultaneous], cursor)).toEqual([simultaneous]);
    expect(advanceNotificationToastCursor(cursor, [simultaneous]).keysAtLatest).toHaveLength(2);
  });

  test("never moves the cursor backwards", () => {
    const cursor = createNotificationToastCursor([notification("latest", 500)], 0);
    expect(advanceNotificationToastCursor(cursor, [notification("stale", 100)])).toEqual(cursor);
  });

  test("keeps popup notifications silent when the preference is disabled", () => {
    const item = notification("muted", 500);

    expect(visibleNotificationToastItems([item], false, () => false)).toEqual([]);
    expect(visibleNotificationToastItems([item], true, () => false)).toEqual([item]);
  });

  test("tells live notifications apart by stream and never hides them as videos", () => {
    const live = (streamId: string, createdAt: number): NotificationItem => ({
      type: "twitch_live_started",
      title: "Speedrun",
      createdAt,
      publishedAt: createdAt,
      channelUrl: "https://www.twitch.tv/runner",
      channelName: "Runner",
      channelAvatarUrl: "avatar.jpg",
      serviceId: -1,
      serviceName: "Twitch",
      live: { streamId, login: "runner", category: "Celeste" },
    });
    const cursor = createNotificationToastCursor([live("s1", 700)], 0);
    expect(findNewNotificationItems([live("s1", 700), live("s2", 700)], cursor)).toEqual([
      live("s2", 700),
    ]);
    expect(notificationKey(live("s2", 700))).toBe("twitch_live_started:s2");
    expect(visibleNotificationToastItems([live("s3", 800)], true, () => true)).toHaveLength(1);
  });

  test("rejects malformed persisted cursors", () => {
    expect(parseNotificationToastCursor(null)).toBeNull();
    expect(parseNotificationToastCursor({ latestCreatedAt: "now", keysAtLatest: [] })).toBeNull();
    expect(parseNotificationToastCursor({ latestCreatedAt: 100, keysAtLatest: [1] })).toBeNull();
  });
});
