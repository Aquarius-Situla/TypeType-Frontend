import { useEffect, useMemo } from "react";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useHomeRecommendations } from "../hooks/use-home-recommendations";
import { useSettings } from "../hooks/use-settings";
import { shouldAutoLoadEmptyHomePage } from "../lib/home-recommendations-pagination";
import { m } from "../paraglide/messages.js";
import { type HomeLayout, useHomeLayoutStore } from "../stores/home-layout-store";
import { Segmented } from "./algorithm/algorithm-segmented";
import { FamilyListEmptyState } from "./family-list-empty-state";
import { HomeFallbackSection } from "./home-fallback-section";
import { HomeRecommenderFeedback } from "./home-recommender-feedback";
import { HomeRecommenderRows } from "./home-recommender-rows";
import { ScrollSentinel } from "./scroll-sentinel";
import { VideoGrid } from "./video-grid";
import { VideoGridSkeleton } from "./video-grid-skeleton";

export function HomeRecommendationsSection() {
  const {
    streams,
    rows,
    algorithm,
    isPreparing,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    pageCount,
  } = useHomeRecommendations();
  const { settings } = useSettings();
  const layout = useHomeLayoutStore((state) => state.layout);
  const setLayout = useHomeLayoutStore((state) => state.setLayout);
  const { filter } = useBlockedFilter();
  const filtered = useMemo(() => filter(streams), [filter, streams]);
  const autoLoadEmptyPage = shouldAutoLoadEmptyHomePage({
    itemCount: filtered.length,
    pageCount,
    hasNextPage,
    isLoading,
    isPreparing,
    isError,
    isFetchingNextPage,
  });

  useEffect(() => {
    if (autoLoadEmptyPage) fetchNextPage();
  }, [autoLoadEmptyPage, fetchNextPage]);

  if (isLoading) return <VideoGridSkeleton idPrefix="home-recommendations" />;
  if (isPreparing) {
    return (
      <>
        <p role="status" className="text-sm text-fg-muted">
          {m.home_algo_preparing()}
        </p>
        <VideoGridSkeleton idPrefix="home-recommendations-preparing" />
      </>
    );
  }
  if (filtered.length === 0 && (isFetchingNextPage || autoLoadEmptyPage)) {
    return <VideoGridSkeleton idPrefix="home-recommendations-filtered" />;
  }
  if (isError || filtered.length === 0) {
    const emptyState =
      settings.accessMode === "allow_list" ? (
        <FamilyListEmptyState title={m.ui_no_family_recommendations_yet()} />
      ) : (
        <HomeFallbackSection />
      );
    return (
      <div className="flex flex-col items-start gap-3">
        {emptyState}
        {!isError && hasNextPage && (
          <button
            type="button"
            onClick={fetchNextPage}
            className="text-sm text-fg-soft underline transition-colors hover:text-fg"
          >
            {m.ui_load_more()}
          </button>
        )}
      </div>
    );
  }
  if (algorithm && rows.length > 0) {
    return (
      <>
        <div className="flex justify-end">
          <Segmented<HomeLayout>
            label={m.home_algo_layout()}
            value={layout}
            options={[
              { value: "grid", label: m.home_algo_layout_grid() },
              { value: "rows", label: m.home_algo_layout_rows() },
            ]}
            onChange={setLayout}
          />
        </div>
        <HomeRecommenderRows rows={rows} streams={filtered} flat={layout === "grid"} />
        {isFetchingNextPage && <VideoGridSkeleton idPrefix="home-recommendations-next" />}
        <ScrollSentinel onIntersect={fetchNextPage} enabled={hasNextPage && !isFetchingNextPage} />
        {!hasNextPage && <HomeRecommenderFeedback />}
      </>
    );
  }
  return (
    <>
      <VideoGrid streams={filtered} />
      {isFetchingNextPage && <VideoGridSkeleton idPrefix="home-recommendations-next" />}
      <ScrollSentinel onIntersect={fetchNextPage} enabled={hasNextPage && !isFetchingNextPage} />
    </>
  );
}
