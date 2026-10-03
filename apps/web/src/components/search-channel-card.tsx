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
  banner?: boolean;
};

export function SearchChannelCard({ channel, banner }: Props) {
  if (banner) {
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
                {m.ui_channel()}
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
    <article className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-card/40 p-3 sm:p-4 transition-colors hover:border-border-strong hover:bg-card/70">
      <ChannelRouteLink
        url={channel.url}
        className="group flex min-w-0 flex-1 items-center gap-3 sm:gap-4"
      >
        <ChannelAvatar
          src={proxyImage(channel.thumbnailUrl)}
          name={channel.name}
          className="h-12 w-12 shrink-0 transition-transform duration-200 group-hover:scale-105 sm:h-14 sm:w-14"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold text-fg transition-colors group-hover:text-accent sm:text-base">
              {channel.name}
            </span>
            {channel.isVerified && (
              <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-accent" aria-hidden="true" />
            )}
          </div>
          <p className="mt-0.5 text-xs text-fg-muted">
            {formatSubscribers(channel.subscriberCount)}
          </p>
          {channel.description && (
            <p className="mt-1 line-clamp-1 text-xs text-fg-muted/90 sm:line-clamp-2">
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
