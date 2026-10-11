import { useMemo } from "react";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useSubscriptionFeed } from "../hooks/use-subscription-feed";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { m } from "../paraglide/messages.js";
import { ScrollSentinel } from "./scroll-sentinel";
import { VideoGrid } from "./video-grid";
import { VideoGridSkeleton } from "./video-grid-skeleton";

function FeedSection() {
  const { streams, isLoading, isPreparing, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useSubscriptionFeed();
  const { filter } = useBlockedFilter();
  const filtered = useMemo(() => filter(streams), [filter, streams]);
  if (isLoading || isPreparing) return <VideoGridSkeleton idPrefix="home-feed" />;
  return (
    <>
      <VideoGrid streams={filtered} />
      {isFetchingNextPage && <VideoGridSkeleton idPrefix="home-feed-next" />}
      <ScrollSentinel onIntersect={fetchNextPage} enabled={hasNextPage && !isFetchingNextPage} />
    </>
  );
}

export function HomeFallbackSection() {
  const { query } = useSubscriptions();
  const hasSubs = (query.data ?? []).length > 0;
  if (query.isLoading) return <VideoGridSkeleton idPrefix="home-fallback" />;
  if (hasSubs) return <FeedSection />;
  return (
    <section className="rounded-xl border border-border bg-surface/70 p-6 text-center">
      <h2 className="text-sm font-semibold text-fg">{m.ui_no_subscriptions_yet()}</h2>
      <p className="mt-1 text-xs text-fg-muted">
        {m.ui_subscribe_to_channels_to_unlock_a_personalized_home_feed()}
      </p>
    </section>
  );
}
