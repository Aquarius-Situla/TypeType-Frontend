import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchHomeRecommendations, type RecommendationIntent } from "../lib/api-recommendations";
import { mapVideoItem } from "../lib/mappers";
import { profileScopedQueryKey } from "../lib/profile-scoped-query-key";
import type { HomeRecommendationsResponse } from "../types/api";
import type { HomeRecommendationRow } from "../types/recommender";
import type { VideoStream } from "../types/stream";
import { useAuth } from "./use-auth";
import { usePreparingWindow } from "./use-preparing-window";
import { useSettings } from "./use-settings";

const PAGE_SIZE = 30;
const WAIT_MS = 3_000;
const MAX_WAITS = 30;

type Result = {
  streams: VideoStream[];
  rows: HomeRecommendationRow[];
  algorithm: string | null;
  isPreparing: boolean;
  serviceId: number;
  intent: RecommendationIntent;
  isLoading: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  pageCount: number;
};

function mergeRows(pages: HomeRecommendationsResponse[]): HomeRecommendationRow[] {
  const merged = new Map<string, HomeRecommendationRow>();
  for (const row of pages.flatMap((page) => page.rows ?? [])) {
    const known = merged.get(row.id);
    merged.set(
      row.id,
      known ? { ...known, videoUrls: [...known.videoUrls, ...row.videoUrls] } : row,
    );
  }
  return [...merged.values()];
}

export function useHomeRecommendations(): Result {
  const { authReady, isAuthed, me } = useAuth();
  const profileId = me?.id ?? null;
  const { settings } = useSettings();
  const intent: RecommendationIntent = "auto";
  const query = useInfiniteQuery({
    queryKey: profileScopedQueryKey(
      ["home-recommendations", "v2", settings.defaultService, intent],
      profileId,
    ),
    queryFn: ({ pageParam }) =>
      fetchHomeRecommendations(
        settings.defaultService,
        PAGE_SIZE,
        pageParam as string | undefined,
        intent,
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore ? (last.nextCursor ?? undefined) : undefined),
    enabled: authReady && isAuthed && profileId !== null && !settings.hideHomeRecommendations,
    staleTime: 90 * 1000,
    // Server serves the standard page while the algorithm builds its own, and says so: the
    // home page is asked again until the algorithm's page is there.
    refetchInterval: (state) =>
      state.state.data?.pages[0]?.preparing === true && state.state.dataUpdateCount <= MAX_WAITS
        ? WAIT_MS
        : false,
  });

  const streams = useMemo(
    () => (query.data?.pages ?? []).flatMap((page) => page.items).map(mapVideoItem),
    [query.data],
  );

  const isPreparing = usePreparingWindow(
    query.data?.pages[0]?.preparing === true,
    query.dataUpdatedAt,
    WAIT_MS * MAX_WAITS,
  );
  const rows = useMemo(() => mergeRows(query.data?.pages ?? []), [query.data]);

  return {
    streams,
    rows,
    algorithm: query.data?.pages[0]?.algorithm ?? null,
    isPreparing,
    serviceId: settings.defaultService,
    intent,
    isLoading: query.isLoading,
    isError: query.isError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    pageCount: query.data?.pages.length ?? 0,
  };
}
