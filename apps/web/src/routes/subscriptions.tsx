import { useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ScrollSentinel } from "../components/scroll-sentinel";
import { SubscriptionFeedOrderSelect } from "../components/subscription-feed-order";
import { SubscriptionFeedSelection } from "../components/subscription-feed-selection";
import { SubscriptionGroupFilter } from "../components/subscription-group-filter";
import { SubscriptionsHeader } from "../components/subscriptions-header";
import { Toast } from "../components/toast";
import { VideoGrid } from "../components/video-grid";
import { VideoGridSkeleton } from "../components/video-grid-skeleton";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { canMarkWatched, useMarkVideosWatched } from "../hooks/use-mark-videos-watched";
import { streamQueryOptions } from "../hooks/use-stream";
import { useSubscriptionFeed } from "../hooks/use-subscription-feed";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { ApiError } from "../lib/api";
import {
  subscriptionFeedQueryOptions,
  subscriptionsQueryOptions,
} from "../lib/subscription-queries";
import { isUpcomingStream } from "../lib/upcoming-stream";
import { m } from "../paraglide/messages.js";
import type { SubscriptionFeedOrder } from "../types/api";

function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const prefetchedIdsRef = useRef(new Set<string>());
  const { group = "all", order = "newest" } = Route.useSearch();
  const navigate = Route.useNavigate();
  const { query } = useSubscriptions(group);
  const subscriptions = query.data ?? [];
  const {
    streams,
    isPreparing,
    isLoading,
    isLoadingError,
    isFetchNextPageError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
    error: feedError,
  } = useSubscriptionFeed(group, order);
  const { filter } = useBlockedFilter();
  const visible = useMemo(() => filter(streams), [filter, streams]);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<ReadonlySet<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const markWatched = useMarkVideosWatched();

  function stopSelecting() {
    setSelecting(false);
    setSelected(new Set());
  }

  function toggleSelected(id: string) {
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  function markSelected(watched: boolean) {
    const chosen = visible.filter((stream) => selected.has(stream.id));
    markWatched.mutate(
      { streams: chosen, watched },
      {
        onSuccess: (count) => {
          setToast(
            watched
              ? m.subscriptions_marked_watched({ count })
              : m.subscriptions_marked_unwatched({ count }),
          );
          window.setTimeout(() => setToast(null), 2500);
          stopSelecting();
        },
        onError: () => {
          setToast(m.subscriptions_mark_failed());
          window.setTimeout(() => setToast(null), 3500);
        },
      },
    );
  }

  function prefetchChannels() {
    void queryClient.prefetchQuery(subscriptionsQueryOptions(group));
  }

  function prefetchVideos() {
    if (!query.data?.length) return;
    void queryClient.prefetchInfiniteQuery(subscriptionFeedQueryOptions(group, order));
  }

  useEffect(() => {
    if (streams.length > 0) {
      const topVideos = streams.slice(0, 5);
      for (const video of topVideos) {
        if (prefetchedIdsRef.current.has(video.id) || isUpcomingStream(video)) continue;
        // A live or a replay of one is never kept by Server: preparing it would open it at the
        // provider on every visit of this page.
        if (video.isLive || video.isPostLive || video.isLiveContent) continue;
        prefetchedIdsRef.current.add(video.id);
        void queryClient
          .prefetchQuery(streamQueryOptions(video.id, false, true, false, true))
          .catch((error) => {
            if (error instanceof ApiError && [400, 404, 409, 422].includes(error.status)) return;
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
      <div className="flex flex-wrap items-center gap-2">
        <SubscriptionGroupFilter
          value={group}
          error={query.error ?? feedError}
          onChange={(value, replace) =>
            void navigate({ search: (prev) => ({ ...prev, group: value }), replace })
          }
        />
        <SubscriptionFeedOrderSelect
          value={order}
          onChange={(value) =>
            void navigate({
              search: (prev) => ({ ...prev, order: value === "oldest" ? value : undefined }),
            })
          }
        />
        {visible.length > 0 && (
          <SubscriptionFeedSelection
            selecting={selecting}
            selectedCount={selected.size}
            pending={markWatched.isPending}
            onStart={() => setSelecting(true)}
            onSelectAll={() =>
              setSelected(new Set(visible.filter(canMarkWatched).map((stream) => stream.id)))
            }
            onMark={markSelected}
            onCancel={stopSelecting}
          />
        )}
      </div>
      {isPreparing ? (
        <>
          <p role="status" className="text-sm text-fg-muted">
            {m.subscriptions_feed_preparing()}
          </p>
          <VideoGridSkeleton idPrefix="subscriptions-preparing" />
        </>
      ) : query.isLoading || isLoading ? (
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
          <VideoGrid
            streams={visible}
            selection={
              selecting
                ? {
                    selected,
                    onToggle: (stream) => toggleSelected(stream.id),
                    canSelect: canMarkWatched,
                  }
                : undefined
            }
          />
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
      <Toast message={toast} />
    </div>
  );
}

export const Route = createFileRoute("/subscriptions")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { group?: string; order?: SubscriptionFeedOrder } => ({
    group: typeof search.group === "string" && search.group ? search.group : "all",
    ...(search.order === "oldest" ? { order: "oldest" as const } : {}),
  }),
  component: SubscriptionsPage,
});
