import { BadgeCheck } from "lucide-react";
import { formatSubscribers } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import type { ChannelResultItem } from "../types/api";
import { AllowChannelButton } from "./allow-channel-button";
import { ChannelAvatar } from "./channel-avatar";
import { ChannelRouteLink } from "./channel-route-link";

type Props = {
  channel: ChannelResultItem;
  banner?: boolean;
};

export function SearchChannelCard({ channel, banner }: Props) {
  if (banner) {
    const isBilibili = channel.url.includes("bilibili") || channel.url.includes("space.");
    return (
      <article className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-border bg-card/60 p-4 sm:p-5 backdrop-blur-sm transition-all hover:border-border-strong">
        <ChannelRouteLink
          url={channel.url}
          className="group flex min-w-0 flex-1 items-center gap-4"
        >
          <ChannelAvatar
            src={proxyImage(channel.thumbnailUrl)}
            name={channel.name}
            className="h-16 w-16 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:h-20 sm:w-20"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="truncate text-base font-semibold text-fg transition-colors group-hover:text-accent sm:text-lg">
                {channel.name}
              </span>
              {channel.isVerified && (
                <BadgeCheck className="h-4 w-4 shrink-0 text-accent" aria-hidden="true" />
              )}
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                {isBilibili ? "UP主" : "Channel"}
              </span>
            </div>
            <p className="mt-1 text-xs font-medium text-fg-muted sm:text-sm">
              {formatSubscribers(channel.subscriberCount)}
            </p>
            {channel.description && (
              <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-fg-muted">
                {channel.description}
              </p>
            )}
          </div>
        </ChannelRouteLink>
        <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
          <ChannelRouteLink
            url={channel.url}
            className="inline-flex items-center justify-center rounded-lg border border-border px-3.5 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-hover hover:text-fg-strong"
          >
            {isBilibili ? "进入空间" : "View channel"}
          </ChannelRouteLink>
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

  return (
    <article className="flex flex-col items-center gap-2 text-center">
      <ChannelRouteLink url={channel.url} className="group flex w-full flex-col items-center gap-2">
        <div className="flex aspect-video w-full items-center justify-center">
          <ChannelAvatar
            src={proxyImage(channel.thumbnailUrl)}
            name={channel.name}
            className="h-24 w-24 transition-transform duration-200 group-hover:scale-105"
          />
        </div>
        <div className="min-w-0 px-1">
          <p className="flex items-center justify-center gap-1 text-sm font-medium text-fg group-hover:text-fg-strong">
            <span className="line-clamp-1">{channel.name}</span>
            {channel.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-fg-muted" aria-hidden="true" />
            )}
          </p>
          <p className="mt-1 text-xs text-fg-muted">{formatSubscribers(channel.subscriberCount)}</p>
        </div>
      </ChannelRouteLink>
      <div className="min-h-7">
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
