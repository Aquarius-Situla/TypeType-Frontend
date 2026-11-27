import { BellRing, X } from "lucide-react";
import { useClientLocale } from "../hooks/use-client-locale";
import { formatPublishedDate } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { NotificationItem } from "../types/notifications";
import "../styles/notification-toast.css";

type Props = {
  items: NotificationItem[];
  onOpen: () => void;
  onClose: () => void;
  onPausedChange: (paused: boolean) => void;
};

function NotificationVisual({ items }: { items: NotificationItem[] }) {
  const first = items[0];
  const thumbnail =
    first?.type === "subscription_new_video" ? first.video.thumbnailUrl : first?.channelAvatarUrl;
  const source = thumbnail ? proxyImage(thumbnail) : "/logo.svg";
  if (items.length === 1) {
    return (
      <img
        src={source}
        alt=""
        className="h-11 w-12 shrink-0 rounded-md border border-border object-cover"
      />
    );
  }
  return (
    <span className="relative h-11 w-12 shrink-0" aria-hidden="true">
      <span className="absolute right-0 top-0 h-9 w-10 rounded-md border border-border-strong bg-surface-soft" />
      <img
        src={source}
        alt=""
        className="absolute bottom-0 left-0 h-9 w-10 rounded-md border border-border-strong object-cover"
      />
    </span>
  );
}

export function NotificationToast({ items, onOpen, onClose, onPausedChange }: Props) {
  const locale = useClientLocale();
  const first = items[0];
  if (!first) return null;
  const grouped = items.length > 1;
  const channelCount = new Set(items.map((item) => item.channelUrl || item.channelName)).size;
  const publishedAt =
    first.publishedAt ??
    (first.type === "subscription_new_video" ? first.video.publishedAt : null) ??
    first.createdAt;
  const publishedText = formatPublishedDate(publishedAt, undefined, locale) || m.ui_just_now();
  const title = grouped
    ? m.ui_videos_waiting()
    : first.type === "twitch_live_started"
      ? m.notification_twitch_live({ name: first.channelName })
      : first.video.title;
  const source = grouped
    ? `${channelCount} ${channelCount === 1 ? m.ui_channel() : m.ui_channels()}`
    : first.channelName;

  return (
    <aside
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="notification-toast"
      onPointerEnter={() => onPausedChange(true)}
      onPointerLeave={() => onPausedChange(false)}
      onFocusCapture={() => onPausedChange(true)}
      onBlurCapture={() => onPausedChange(false)}
    >
      <div className="flex items-center">
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 items-center gap-2.5 p-2 text-left hover:bg-surface-strong/70"
        >
          <NotificationVisual items={items} />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-1 text-[10px] font-semibold uppercase text-accent">
              <BellRing size={11} aria-hidden="true" />
              {grouped ? m.ui_new_uploads({ count: items.length }) : m.ui_new_upload()}
            </span>
            <span className="mt-0.5 block truncate text-[13px] font-medium leading-tight text-fg">
              {title}
            </span>
            <span className="mt-1 flex items-center gap-1.5 text-[11px] text-fg-muted">
              <span className="truncate">{source}</span>
              <span className="shrink-0 text-fg-soft">
                {grouped ? m.ui_just_now() : publishedText}
              </span>
            </span>
          </span>
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mr-1.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-fg-soft hover:bg-surface-strong hover:text-fg"
          aria-label={m.ui_dismiss_notification()}
          title={m.ui_dismiss()}
        >
          <X size={14} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
