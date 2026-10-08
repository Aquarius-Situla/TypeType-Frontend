import { useMemo } from "react";
import { useBlockedFilter } from "../hooks/use-blocked-filter";
import { useHomeRecommendations } from "../hooks/use-home-recommendations";
import { useSettings } from "../hooks/use-settings";
import { useSubscriptions } from "../hooks/use-subscriptions";
import { m } from "../paraglide/messages.js";
import { shouldFilterEntertainment, useFocusModeStore } from "../stores/focus-mode-store";
import { FamilyListEmptyState } from "./family-list-empty-state";
import { HomeFallbackSection } from "./home-fallback-section";
import { ScrollSentinel } from "./scroll-sentinel";
import { VideoGrid } from "./video-grid";
import { VideoGridSkeleton } from "./video-grid-skeleton";

export function HomeRecommendationsSection() {
  const { streams, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useHomeRecommendations();
  const { settings } = useSettings();
  const { filter } = useBlockedFilter();
  const focusMode = useFocusModeStore();
  const entSubs = useSubscriptions(focusMode.entertainmentGroupId ?? undefined);

  const entChannelUrls = useMemo(() => {
    if (!focusMode.enabled || !focusMode.entertainmentGroupId) return new Set<string>();
    return new Set(entSubs.query.data?.map((s) => s.url) ?? []);
  }, [focusMode.enabled, focusMode.entertainmentGroupId, entSubs.query.data]);

  const filtered = useMemo(() => {
    const unblocked = filter(streams);
    if (!focusMode.enabled || !focusMode.entertainmentGroupId || entChannelUrls.size === 0) {
      return unblocked;
    }
    return unblocked.filter((stream) => {
      if (entChannelUrls.has(stream.uploaderUrl)) {
        return !shouldFilterEntertainment(focusMode, stream.id);
      }
      return true;
    });
  }, [filter, streams, focusMode, entChannelUrls]);

  if (isLoading) return <VideoGridSkeleton idPrefix="home-recommendations" />;
  if (isError || filtered.length === 0) {
    if (settings.accessMode === "allow_list") {
      return <FamilyListEmptyState title={m.ui_no_family_recommendations_yet()} />;
    }
    return <HomeFallbackSection />;
  }
  return (
    <>
      <VideoGrid streams={filtered} />
      {isFetchingNextPage && <VideoGridSkeleton idPrefix="home-recommendations-next" />}
      <ScrollSentinel onIntersect={fetchNextPage} enabled={hasNextPage && !isFetchingNextPage} />
    </>
  );
}
