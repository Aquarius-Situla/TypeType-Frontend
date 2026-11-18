import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useChannel } from "../hooks/use-channel";
import type { ChannelSort } from "../lib/api-discovery";
import { channelRouteFromVideos } from "../lib/channel-alias-url";
import { type ChannelTab, channelPathSearch } from "../lib/channel-route-url";
import { ChannelPageContent } from "./channel-page-content";

type Props = {
  sourceUrl: string;
  sort: ChannelSort;
  searchQuery: string;
  tab: ChannelTab;
  onNavigate: (sort: ChannelSort, query: string, tab: ChannelTab) => void;
};

// Subscriptions and blocks are keyed by channel address, so an alias moves to the channel's stable page once known.
export function ChannelAliasPage({ sourceUrl, sort, searchQuery, tab, onNavigate }: Props) {
  const navigate = useNavigate();
  const { meta, videos } = useChannel(sourceUrl, sort, searchQuery, tab === "live");
  const route = channelRouteFromVideos(meta?.name, videos);

  useEffect(() => {
    if (!route) return;
    navigate({
      to: "/channel/$provider/$channelId",
      params: { provider: route.provider, channelId: route.id },
      search: channelPathSearch(sort, searchQuery, tab),
      replace: true,
    });
  }, [navigate, route, searchQuery, sort, tab]);

  return (
    <ChannelPageContent
      sourceUrl={sourceUrl}
      sort={sort}
      searchQuery={searchQuery}
      tab={tab}
      onNavigate={onNavigate}
    />
  );
}
