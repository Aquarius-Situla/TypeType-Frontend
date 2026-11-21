import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useDeArrowBranding } from "../hooks/use-dearrow";
import { useFocusVisualFilter } from "../hooks/use-focus-visual-filter";
import { useWatchedThreshold } from "../hooks/use-watched-threshold";
import { formatDuration } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { isVideoWatched } from "../lib/watch-progress";
import { watchRouteSearch } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import type { HistoryItem } from "../types/user";
import { ChannelRouteLink } from "./channel-route-link";
import { HistoryChannelAvatar } from "./history-channel-avatar";
import { VideoProgressBar } from "./video-progress-bar";
import { WatchedBadge } from "./watched-badge";

type HistoryCardProps = { item: HistoryItem; onRemove: () => void };

function formatWatchedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HistoryCard({ item, onRemove }: HistoryCardProps) {
  const watchedThreshold = useWatchedThreshold();
  const watched = isVideoWatched(item.progress, item.duration, watchedThreshold);
  const { shouldGrayscaleChannel } = useFocusVisualFilter();
  const focusGrayscale = shouldGrayscaleChannel(item.channelUrl);
  const branding = useDeArrowBranding(
    item.url,
    item.title,
    proxyImage(item.thumbnail),
    item.duration,
  );

  return (
    <div className="group relative grid grid-cols-[8.75rem_minmax(0,1fr)] gap-3 rounded-2xl border border-border bg-surface/45 p-2.5 sm:flex sm:flex-col sm:gap-2 sm:border-0 sm:bg-transparent sm:p-0">
      <div className="relative min-w-0 sm:w-full">
        <Link to="/watch" search={watchRouteSearch(item.url)} className="block">
          <div className="relative aspect-video overflow-hidden rounded-xl bg-surface-strong sm:rounded-lg">
            <img
              src={branding.thumbnail}
              alt={branding.title}
              className={`h-full w-full object-cover transition-transform duration-200 group-hover:scale-105 ${
                watched ? "grayscale opacity-60" : focusGrayscale ? "grayscale" : ""
              }`}
              loading="lazy"
              decoding="async"
            />
            {item.duration > 0 && (
              <span className="absolute bottom-1.5 right-1.5 bg-black/80 text-white text-xs px-1 rounded">
                {formatDuration(item.duration)}
              </span>
            )}
            {watched && (
              <span className="absolute top-2 left-2">
                <WatchedBadge />
              </span>
            )}
            <VideoProgressBar progress={item.progress} duration={item.duration} alwaysVisible />
          </div>
        </Link>
        <button
          type="button"
          onClick={onRemove}
          aria-label={m.ui_remove_from_history()}
          className="absolute top-1.5 right-1.5 flex h-9 w-9 items-center justify-center rounded-full bg-black/75 text-white opacity-100 shadow-sm transition-colors hover:bg-black/90 sm:h-7 sm:w-7 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
        >
          <X className="h-4 w-4 sm:h-3.5 sm:w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className="flex min-w-0 gap-2 py-0.5 sm:flex-none sm:py-0">
        {item.channelUrl ? (
          <ChannelRouteLink url={item.channelUrl} className="mt-0.5 hidden flex-shrink-0 sm:block">
            <HistoryChannelAvatar item={item} className="h-7 w-7" />
          </ChannelRouteLink>
        ) : (
          <span className="mt-0.5 hidden flex-shrink-0 sm:block">
            <HistoryChannelAvatar item={item} className="h-7 w-7" />
          </span>
        )}
        <div className="flex min-w-0 flex-col gap-1.5 sm:gap-0.5">
          <Link to="/watch" search={watchRouteSearch(item.url)} className="min-w-0">
            <p className="line-clamp-2 text-sm font-semibold leading-snug text-fg sm:font-medium">
              {branding.title}
            </p>
          </Link>
          {item.channelUrl ? (
            <ChannelRouteLink
              url={item.channelUrl}
              className="w-fit max-w-full truncate text-xs text-fg-muted transition-colors hover:text-fg"
            >
              {item.channelName}
            </ChannelRouteLink>
          ) : (
            <p className="truncate text-xs text-fg-muted">{item.channelName}</p>
          )}
          <p className="line-clamp-1 text-[11px] text-fg-soft sm:mt-0">
            {m.ui_watched()} {formatWatchedAt(item.watchedAt)}
          </p>
        </div>
      </div>
    </div>
  );
}
