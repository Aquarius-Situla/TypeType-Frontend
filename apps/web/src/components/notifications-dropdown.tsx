import { useEffect, useRef, useState } from "react";
import { useMobile } from "../hooks/use-mobile";
import { useNotifications } from "../hooks/use-notifications";
import { notificationKey } from "../lib/notification-toast-cursor";
import { m } from "../paraglide/messages.js";
import { useUiStore } from "../stores/ui-store";
import { NotificationBellIcon } from "./notification-bell-icon";
import { NotificationRow } from "./notification-row";
import { ScrollSentinel } from "./scroll-sentinel";

export function NotificationsDropdown() {
  const open = useUiStore((state) => state.notificationCenterOpen);
  const close = useUiStore((state) => state.closeNotificationCenter);
  const toggle = useUiStore((state) => state.toggleNotificationCenter);
  const isMobile = useMobile();
  const rootRef = useRef<HTMLDivElement>(null);
  const [scrollRoot, setScrollRoot] = useState<HTMLDivElement | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const {
    enabled,
    query,
    unreadQuery,
    items,
    unreadCount,
    badgeUnavailable,
    markAllRead,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useNotifications(open);

  useEffect(() => {
    if (!open || hasLoaded) return;
    setHasLoaded(true);
  }, [open, hasLoaded]);

  useEffect(() => {
    if (!enabled) close();
  }, [close, enabled]);

  useEffect(() => {
    function onMouseDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close();
    }
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [close]);

  if (!enabled) return null;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={toggle}
        className="relative inline-flex h-9 w-9 items-center justify-center text-fg-muted hover:text-fg"
        aria-label={m.ui_notifications()}
      >
        <NotificationBellIcon />
        {(badgeUnavailable || (unreadCount !== null && unreadCount > 0)) && (
          <span
            title={badgeUnavailable ? m.ui_badge_temporarily_unavailable() : undefined}
            className="absolute -right-1 -top-1 min-w-4 rounded-full bg-danger-strong px-1 text-center text-[10px] font-semibold text-white"
          >
            {badgeUnavailable
              ? "!"
              : unreadCount !== null && unreadCount > 99
                ? "99+"
                : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className={
            isMobile
              ? "fixed left-2 right-2 top-16 z-50 overflow-hidden rounded-md border border-border-strong bg-surface shadow-2xl"
              : "absolute right-0 top-full z-50 mt-2 w-[calc(100vw-1rem)] max-w-[26rem] overflow-hidden rounded-md border border-border-strong bg-surface shadow-2xl"
          }
        >
          <div className="flex items-center justify-between border-b border-border px-3 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-fg-muted">
              {m.ui_notifications()}
            </p>
            <button
              type="button"
              onClick={() => markAllRead.mutate()}
              disabled={
                unreadCount === null ||
                unreadCount === 0 ||
                badgeUnavailable ||
                markAllRead.isPending
              }
              className="text-xs text-fg-muted hover:text-fg-strong disabled:cursor-not-allowed disabled:text-fg-soft"
            >
              {m.ui_mark_all_read()}
            </button>
          </div>

          <div ref={setScrollRoot} className="max-h-[28rem] overflow-y-auto px-2 py-2">
            {!hasLoaded && (
              <p className="px-2 py-3 text-xs text-fg-soft">
                {m.ui_open_notifications_to_load_items()}
              </p>
            )}
            {hasLoaded && query.isFetching && items.length === 0 && (
              <p className="px-2 py-3 text-xs text-fg-soft">{m.ui_loading_notifications()}</p>
            )}
            {hasLoaded && query.isError && (
              <p className="px-2 py-3 text-xs text-danger">
                {m.ui_failed_to_load_notifications_retry_in_a_few_seconds()}
              </p>
            )}
            {hasLoaded && query.data?.pages.some((page) => !page.available) && (
              <p className="px-2 py-3 text-xs text-fg-soft">
                {m.ui_badge_temporarily_unavailable()}
              </p>
            )}
            {hasLoaded &&
              !query.isFetching &&
              !query.isError &&
              !query.data?.pages.some((page) => !page.available) &&
              items.length === 0 && (
                <p className="px-2 py-3 text-xs text-fg-soft">{m.ui_no_notifications_yet()}</p>
              )}
            {items.map((item) => (
              <NotificationRow
                key={`${notificationKey(item)}-${item.createdAt}`}
                item={item}
                onOpen={close}
              />
            ))}
            {hasLoaded && (
              <ScrollSentinel
                root={scrollRoot}
                onIntersect={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    void fetchNextPage();
                  }
                }}
                enabled={open && hasNextPage && !isFetchingNextPage}
              />
            )}
            {isFetchingNextPage && (
              <p className="px-2 py-2 text-xs text-fg-soft">{m.ui_loading_more()}</p>
            )}
            {isFetchNextPageError && (
              <p className="px-2 py-2 text-xs text-danger">
                {m.ui_rate_limited_while_loading_more()}
              </p>
            )}
            {unreadQuery.isError && (
              <p className="px-2 py-2 text-xs text-fg-soft">
                {m.ui_badge_temporarily_unavailable()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
