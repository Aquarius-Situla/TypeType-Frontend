import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { ScrollSentinel } from "../components/scroll-sentinel";
import { SubscriptionGroupFilter } from "../components/subscription-group-filter";
import { SubscriptionsHeader } from "../components/subscriptions-header";
import { VideoGrid } from "../components/video-grid";
import { VideoGridSkeleton } from "../components/video-grid-skeleton";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { streamQueryOptions } from "../hooks/use-stream";
import { useSubscriptionFeed } from "../hooks/use-subscription-feed";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { ApiError } from "../lib/api";
import {
  subscriptionFeedQueryOptions,
  subscriptionsQueryOptions,
} from "../lib/subscription-queries";
import { m } from "../paraglide/messages.js";

function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const prefetchedIdsRef = useRef(new Set<string>());
  const { group = "all" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { query } = useSubscriptions(group);
  const subscriptions = query.data ?? [];
  const {
    streams,
    isLoading,
    isLoadingError,
    isFetchNextPageError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error: feedError,
  } = useSubscriptionFeed(group);
  const { filter } = useBlockedFilter();
  const visible = useMemo(() => filter(streams), [filter, streams]);

  function prefetchChannels() {
    void queryClient.prefetchQuery(subscriptionsQueryOptions(group));
  }

  function prefetchVideos() {
    if (!query.data?.length) return;
    void queryClient.prefetchInfiniteQuery(subscriptionFeedQueryOptions(group));
  }

  useEffect(() => {
    if (streams.length > 0) {
      const topVideos = streams.slice(0, 5);
      for (const video of topVideos) {
        if (prefetchedIdsRef.current.has(video.id)) continue;
        prefetchedIdsRef.current.add(video.id);
        void queryClient.prefetchQuery(streamQueryOptions(video.id)).catch((error) => {
          if (error instanceof ApiError && [400, 404, 422].includes(error.status)) return;
        });
      }
    }
  }, [streams, queryClient]);

  return (
    <div className="flex flex-col gap-5">
      <SubscriptionsHeader
        active="videos"
        count={subscriptions.length}
        group={group}
        onVideosIntent={prefetchVideos}
        onChannelsIntent={prefetchChannels}
      />
      <SubscriptionGroupFilter
        value={group}
        error={query.error ?? feedError}
        onChange={(value, replace) => void navigate({ search: { group: value }, replace })}
      />
      {query.isLoading || isLoading ? (
        <VideoGridSkeleton idPrefix="subscriptions" />
      ) : query.isLoadingError || isLoadingError ? (
        <div role="alert" className="flex flex-col items-center gap-3 py-10 text-sm text-fg-muted">
          <p>{m.subscriptions_feed_load_error()}</p>
          <button
            type="button"
            disabled={query.isFetching || isLoading}
            onClick={() => {
              void query.refetch();
              refetch();
            }}
            className="min-h-9 border border-border-strong px-3 text-fg hover:bg-surface disabled:opacity-40"
          >
            {m.ui_retry()}
          </button>
        </div>
      ) : (
        <>
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-fg-muted">
              {group === "all" && subscriptions.length === 0
                ? m.ui_no_subscriptions_yet_2()
                : m.sg_empty_feed()}
            </p>
          )}
          <VideoGrid streams={visible} />
          {isFetchingNextPage && <VideoGridSkeleton idPrefix="subscriptions-next" />}
          {isFetchNextPageError && (
            <div
              role="alert"
              className="flex flex-wrap items-center justify-center gap-3 py-4 text-sm text-fg-muted"
            >
              <p>{m.subscriptions_feed_next_page_error()}</p>
              <button
                type="button"
                onClick={fetchNextPage}
                disabled={isFetchingNextPage}
                className="min-h-9 border border-border-strong px-3 text-fg hover:bg-surface disabled:opacity-40"
              >
                {m.ui_retry()}
              </button>
            </div>
          )}
          <ScrollSentinel
            onIntersect={fetchNextPage}
            enabled={hasNextPage && !isFetchingNextPage && !isFetchNextPageError}
          />
        </>
      )}
    </div>
  );
}

export const Route = createFileRoute("/subscriptions")({
  validateSearch: (search: Record<string, unknown>): { group?: string } => ({
    group: typeof search.group === "string" && search.group ? search.group : "all",
  }),
  component: SubscriptionsPage,
});
