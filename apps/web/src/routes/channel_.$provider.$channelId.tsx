import { createFileRoute, notFound } from "@tanstack/react-router";
import { ChannelPageContent } from "../components/channel-page-content";
import type { ChannelSort } from "../lib/api-discovery";
import {
  canonicalChannelSourceUrl,
  channelPathSearch,
  channelTabOrDefault,
} from "../lib/channel-route-url";
import { channelSortOrDefault } from "../lib/channel-sort";

type ChannelPathRouteSearch = { sort?: ChannelSort; q?: string; tab?: "live" | "playlists" };

function validateChannelPathSearch(search: Record<string, unknown>): ChannelPathRouteSearch {
  const sort = channelSortOrDefault(search.sort);
  const query = typeof search.q === "string" ? search.q.trim() : "";
  const tab = channelTabOrDefault(search.tab);
  return channelPathSearch(sort, query, tab);
}

function CanonicalChannelPage() {
  const { provider, channelId } = Route.useParams();
  const { sort: searchSort, q } = Route.useSearch();
  const sort = searchSort ?? "latest";
  const searchQuery = q ?? "";
  const tab = channelTabOrDefault(Route.useSearch().tab);
  const sourceUrl =
    provider === "youtube" || provider === "bilibili" || provider === "niconico"
      ? canonicalChannelSourceUrl({ provider, id: channelId })
      : null;
  const navigate = Route.useNavigate();

  if (!sourceUrl) throw notFound();

  return (
    <ChannelPageContent
      sourceUrl={sourceUrl}
      sort={sort}
      searchQuery={searchQuery}
      tab={tab}
      onNavigate={(nextSort, nextQuery, nextTab) =>
        navigate({ search: () => channelPathSearch(nextSort, nextQuery, nextTab), replace: true })
      }
    />
  );
}

export const Route = createFileRoute("/channel_/$provider/$channelId")({
  validateSearch: validateChannelPathSearch,
  component: CanonicalChannelPage,
});
