import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { FamilyListEmptyState } from "../components/family-list-empty-state";
import { ScrollSentinel } from "../components/scroll-sentinel";
import { SearchFilterBar } from "../components/search-filter-bar";
import { type SearchResultItem, SearchResultsGrid } from "../components/search-results-grid";
import { VideoGridSkeleton } from "../components/video-grid-skeleton";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useSearch } from "../hooks/use-search";
import { useSearchFilters } from "../hooks/use-search-filters";
import { useSettings } from "../hooks/use-settings";
import { updateLiveSearchCategory } from "../lib/search-filter-selection";
import { m } from "../paraglide/messages.js";

function SearchPage() {
  const {
    q,
    service,
    contentFilter,
    filters: selectedFilters = [],
    sortFilter,
  } = Route.useSearch();
  const navigate = useNavigate();
  const filters = useSearchFilters(service, contentFilter);
  const searchFilters = [...selectedFilters, ...(sortFilter ? [sortFilter] : [])].filter(
    (value, index, values) => values.indexOf(value) === index,
  );
  const { settings } = useSettings();
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } = useSearch(
    q,
    service,
    contentFilter,
    searchFilters,
  );
  const { filter, isChannelBlocked, isPlaylistBlocked } = useBlockedFilter();

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const firstPage = data?.pages[0];
  const suggestion = firstPage?.searchSuggestion ?? null;
  const isCorrected = firstPage?.isCorrectedSearch ?? false;

  const seen = new Set<string>();
  const items: SearchResultItem[] = [];
  for (const page of data?.pages ?? []) {
    for (const channel of page.channels) {
      if (isChannelBlocked(channel)) continue;
      if (seen.has(channel.url)) continue;
      seen.add(channel.url);
      items.push({ kind: "channel", channel });
    }
    for (const playlist of page.playlists) {
      if (isPlaylistBlocked(playlist)) continue;
      if (seen.has(playlist.url)) continue;
      seen.add(playlist.url);
      items.push({ kind: "playlist", playlist });
    }
    for (const stream of filter(page.streams)) {
      if (seen.has(stream.id)) continue;
      seen.add(stream.id);
      items.push({ kind: "video", stream });
    }
  }

  function handleSuggestion() {
    if (!suggestion) return;
    navigate({ to: "/search", search: { q: suggestion, service } });
  }

  function setContentFilter(value: string | undefined) {
    navigate({ to: "/search", search: { q, service, contentFilter: value } });
  }

  function setSearchFilters(values: string[]) {
    navigate({
      to: "/search",
      search: { q, service, contentFilter, ...(values.length > 0 ? { filters: values } : {}) },
    });
  }

  function setLiveCategory(enabled: boolean) {
    const selection = filters.data
      ? updateLiveSearchCategory(filters.data, contentFilter, searchFilters, enabled)
      : null;
    if (!selection) return;
    navigate({
      to: "/search",
      search: {
        q,
        service,
        contentFilter: selection.contentFilter,
        ...(selection.filters.length > 0 ? { filters: selection.filters } : {}),
      },
    });
  }

  const filterBar = filters.data ? (
    <SearchFilterBar
      filters={filters.data}
      contentFilter={contentFilter}
      selectedFilters={searchFilters}
      onContentChange={setContentFilter}
      onFiltersChange={setSearchFilters}
      onLiveChange={setLiveCategory}
    />
  ) : null;

  if (isLoading)
    return (
      <div className="pt-3 sm:pt-4">
        {filterBar}
        <VideoGridSkeleton idPrefix="search" />
      </div>
    );

  return (
    <div className="pt-3 sm:pt-4">
      {filterBar}
      {isCorrected && suggestion && (
        <p className="text-sm text-fg-muted mb-4">
          {m.ui_showing_results_for()} <span className="text-fg font-medium">{suggestion}</span>.{" "}
          <button
            type="button"
            onClick={handleSuggestion}
            className="text-accent hover:text-accent-strong underline"
          >
            {m.ui_search_instead_for()}
            {q}&rdquo;
          </button>
        </p>
      )}
      {!isCorrected && suggestion && (
        <p className="text-sm text-fg-muted mb-4">
          {m.ui_did_you_mean()}{" "}
          <button
            type="button"
            onClick={handleSuggestion}
            className="text-accent hover:text-accent-strong underline"
          >
            {suggestion}
          </button>
          ?
        </p>
      )}
      {items.length === 0 ? (
        settings.accessMode === "allow_list" ? (
          <FamilyListEmptyState
            title={m.ui_no_family_list_results()}
            description={m.ui_try_a_channel_you_already_trust_or_add_more_channels_to_the_family_li()}
          />
        ) : (
          <p className="text-fg-muted text-sm">
            {m.ui_no_results_for()}
            {q}&rdquo;
          </p>
        )
      ) : (
        <SearchResultsGrid items={items} />
      )}
      {isFetchingNextPage && <VideoGridSkeleton idPrefix="search-next" />}
      <ScrollSentinel onIntersect={loadMore} enabled={!!hasNextPage && !isFetchingNextPage} />
    </div>
  );
}

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => {
    const filters = Array.isArray(search.filters)
      ? search.filters.filter((value): value is string => typeof value === "string")
      : typeof search.filters === "string"
        ? [search.filters]
        : [];
    return {
      q: typeof search.q === "string" ? search.q : "",
      service: typeof search.service === "number" ? search.service : 0,
      ...(typeof search.contentFilter === "string" ? { contentFilter: search.contentFilter } : {}),
      ...(filters.length > 0 ? { filters } : {}),
      ...(typeof search.sortFilter === "string" ? { sortFilter: search.sortFilter } : {}),
    };
  },
  component: SearchPage,
});
