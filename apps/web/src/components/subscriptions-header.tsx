import { Link } from "@tanstack/react-router";
import { m } from "../paraglide/messages.js";
import { RssShortcut } from "./rss-shortcut";

type Props = {
  active: "videos" | "channels";
  count: number;
  onVideosIntent?: () => void;
  onChannelsIntent?: () => void;
  group?: string;
};

function linkClass(active: boolean): string {
  return active
    ? "border-fg text-fg"
    : "border-transparent text-fg-muted hover:border-border-strong hover:text-fg";
}

export function SubscriptionsHeader({
  active,
  count,
  group = "all",
  onVideosIntent,
  onChannelsIntent,
}: Props) {
  return (
    <header className="flex flex-col gap-5 border-border border-b pt-3 pb-5 sm:flex-row sm:items-end sm:justify-between sm:pt-4">
      <div className="min-w-0">
        <p className="text-[11px] text-fg-soft uppercase tracking-[0.22em]">{m.ui_library()}</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">
          {m.portability_category_subscriptions()}
        </h1>
        <p className="mt-1 text-sm text-fg-muted">
          {count === 1 ? m.ui_channel_followed({ count }) : m.ui_channels_followed({ count })}
        </p>
      </div>
      <nav className="flex items-center gap-6" aria-label={m.ui_subscription_views()}>
        <Link
          to="/subscriptions"
          search={{ group }}
          preload="intent"
          onFocus={onVideosIntent}
          onMouseEnter={onVideosIntent}
          onTouchStart={onVideosIntent}
          className={`border-b pb-1.5 text-sm font-medium transition-colors ${linkClass(active === "videos")}`}
        >
          {m.ui_videos()}
        </Link>
        <Link
          to="/subscriptions/channels"
          search={{ group }}
          preload="intent"
          onFocus={onChannelsIntent}
          onMouseEnter={onChannelsIntent}
          onTouchStart={onChannelsIntent}
          className={`border-b pb-1.5 text-sm font-medium transition-colors ${linkClass(active === "channels")}`}
        >
          {m.groups_preview_channels()}
        </Link>
        <RssShortcut />
      </nav>
    </header>
  );
}
