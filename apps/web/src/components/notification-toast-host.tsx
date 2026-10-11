import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { notificationsUnreadKey } from "../hooks/use-notifications";
import { useSettings } from "../hooks/use-settings";
import { fetchNotifications } from "../lib/api-notifications";
import {
  advanceNotificationToastCursor,
  createNotificationToastCursor,
  findNewNotificationItems,
  type NotificationToastCursor,
  parseNotificationToastCursor,
  visibleNotificationToastItems,
} from "../lib/notification-toast-cursor";
import { watchRouteSearch } from "../lib/watch-url";
import { useUiStore } from "../stores/ui-store";
import type { NotificationItem } from "../types/notifications";
import { NotificationToast } from "./notification-toast";

const POLL_INTERVAL_MS = 60_000;
const DISMISS_AFTER_MS = 6_000;
const STORAGE_PREFIX = "typetype-notification-toast:";

function readCursor(owner: string): NotificationToastCursor | null {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${owner}`);
    return raw ? parseNotificationToastCursor(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}

function writeCursor(owner: string, cursor: NotificationToastCursor): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${owner}`, JSON.stringify(cursor));
  } catch {
    // The in-memory cursor still prevents duplicate toasts for this session.
  }
}

export function NotificationToastHost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { authReady, isAuthed, isGuest, me } = useAuth();
  const { isHidden, ready: visibilityFilterReady } = useBlockedFilter();
  const { settings, settingsReady } = useSettings();
  const openNotificationCenter = useUiStore((state) => state.openNotificationCenter);
  const owner = me?.id ?? null;
  const enabled = authReady && isAuthed && !isGuest && owner !== null;
  const cursorRef = useRef<{ owner: string; cursor: NotificationToastCursor } | null>(null);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [paused, setPaused] = useState(false);
  const query = useQuery({
    queryKey: ["notification-toast-candidates", owner],
    queryFn: () => fetchNotifications(0, 20),
    enabled,
    refetchInterval: enabled ? POLL_INTERVAL_MS : false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: false,
  });

  useEffect(() => {
    cursorRef.current = cursorRef.current?.owner === owner ? cursorRef.current : null;
    setItems([]);
    setPaused(false);
  }, [owner]);

  useEffect(() => {
    if (!enabled || !owner || !query.data || !visibilityFilterReady || !settingsReady) return;
    if (!query.data.available) return;
    queryClient.setQueryData(notificationsUnreadKey(owner), {
      unreadCount: query.data.unreadCount,
      available: true,
    });
    let current = cursorRef.current?.owner === owner ? cursorRef.current.cursor : readCursor(owner);
    if (!current) {
      current = createNotificationToastCursor(query.data.items, Date.now());
      cursorRef.current = { owner, cursor: current };
      writeCursor(owner, current);
      return;
    }
    const newItems = findNewNotificationItems(query.data.items, current);
    const next = advanceNotificationToastCursor(current, query.data.items);
    cursorRef.current = { owner, cursor: next };
    writeCursor(owner, next);
    const visibleItems = visibleNotificationToastItems(
      newItems,
      settings.notificationPopupsEnabled,
      isHidden,
    );
    if (!settings.notificationPopupsEnabled) setItems([]);
    if (visibleItems.length > 0) setItems(visibleItems);
  }, [
    enabled,
    isHidden,
    owner,
    query.data,
    queryClient,
    settings.notificationPopupsEnabled,
    settingsReady,
    visibilityFilterReady,
  ]);

  useEffect(() => {
    if (items.length === 0 || paused) return;
    const timeout = window.setTimeout(() => setItems([]), DISMISS_AFTER_MS);
    return () => window.clearTimeout(timeout);
  }, [items, paused]);

  function openToast() {
    if (items.length === 1) {
      const item = items[0];
      if (item) {
        const videoId = item.video.url.trim() || item.video.id;
        void navigate({ to: "/watch", search: watchRouteSearch(videoId) });
      }
    } else {
      openNotificationCenter();
    }
    setItems([]);
  }

  if (items.length === 0) return null;
  return (
    <NotificationToast
      items={items}
      onOpen={openToast}
      onClose={() => setItems([])}
      onPausedChange={setPaused}
    />
  );
}
