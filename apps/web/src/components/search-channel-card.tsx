import { BadgeCheck } from "lucide-react";
import { formatSubscribers } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { ChannelResultItem } from "../types/api";
import { AllowChannelButton } from "./allow-channel-button";
import { ChannelAvatar } from "./channel-avatar";
import { ChannelRouteLink } from "./channel-route-link";

type Props = {
  channel: ChannelResultItem;
};

export function SearchChannelCard({ channel }: Props) {
  const subscribers = formatSubscribers(channel.subscriberCount);
  const videos =
    channel.streamCount < 0
      ? ""
      : channel.streamCount === 1
        ? m.ui_video_count({ count: channel.streamCount })
        : m.ui_videos_count({ count: channel.streamCount });
  const metadata = [subscribers, videos].filter(Boolean).join(" · ");

  return (
    <article className="flex min-h-28 items-center gap-3 border-b border-border py-4 sm:gap-4">
      <ChannelRouteLink
        url={channel.url}
        className="group flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
      >
        <ChannelAvatar
          src={proxyImage(channel.thumbnailUrl)}
          name={channel.name}
          className="h-14 w-14 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:h-[4.5rem] sm:w-[4.5rem]"
        />
        <div className="min-w-0 flex-1 border-l-2 border-accent/75 py-1 pl-3 sm:pl-4">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-accent sm:text-base">
              {channel.name}
            </span>
            {channel.isVerified && (
              <BadgeCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
            )}
          </div>
          {metadata && <p className="mt-1 truncate text-xs text-fg-muted">{metadata}</p>}
          {channel.description && (
            <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted sm:line-clamp-1">
              {channel.description}
            </p>
          )}
        </div>
      </ChannelRouteLink>
      <div className="shrink-0">
        <AllowChannelButton
          url={channel.url}
          name={channel.name}
          thumbnailUrl={channel.thumbnailUrl}
          compact
        />
      </div>
    </article>
  );
}
