import { useMemo } from "react";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useHomeRecommendations } from "../hooks/use-home-recommendations";
import { useSettings } from "../hooks/use-settings";
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
  } = useHomeRecommendations();
  const { settings } = useSettings();
  const layout = useHomeLayoutStore((state) => state.layout);
  const setLayout = useHomeLayoutStore((state) => state.setLayout);
  const { filter } = useBlockedFilter();
  const filtered = useMemo(() => filter(streams), [filter, streams]);

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
  if (isError || filtered.length === 0) {
    if (settings.accessMode === "allow_list") {
      return <FamilyListEmptyState title={m.ui_no_family_recommendations_yet()} />;
    }
    return <HomeFallbackSection />;
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
