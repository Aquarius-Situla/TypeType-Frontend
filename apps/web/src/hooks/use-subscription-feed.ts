import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { ApiError } from "../lib/api";
import { mapVideoItem } from "../lib/mappers";
import { proxyImage } from "../lib/proxy";
import { subscriptionFeedQueryOptions } from "../lib/subscription-queries";
import type { VideoStream } from "../types/stream";
import { useAuth } from "./use-auth";
import { usePreparingWindow } from "./use-preparing-window";
import { useSubscriptions } from "./use-subscriptions";

// After an import or a first subscription, Server builds the feed in the background: the
// page asks again until it is there, instead of saying there is nothing.
const PREPARING_RETRY_MS = 4_000;
const PREPARING_RETRIES = 20;

type Result = {
  streams: VideoStream[];
  isPreparing: boolean;
  isLoading: boolean;
  isLoadingError: boolean;
  isFetchNextPageError: boolean;
  isFetchingNextPage: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  refetch: () => void;
  error: Error | null;
};

export function useSubscriptionFeed(filter = "all"): Result {
  const { authReady, isAuthed } = useAuth();
  const { query: subsQuery } = useSubscriptions(filter);
  const empty = subsQuery.isSuccess && subsQuery.data.length === 0;
  const queryClient = useQueryClient();
  const avatarMap = useMemo(
    () => new Map((subsQuery.data ?? []).map((s) => [s.channelUrl, proxyImage(s.avatarUrl)])),
    [subsQuery.data],
  );

  const query = useInfiniteQuery({
    ...subscriptionFeedQueryOptions(filter),
    enabled: authReady && isAuthed && subsQuery.isSuccess && !empty,
    refetchInterval: (state) =>
      filter === "all" &&
      state.state.status === "success" &&
      state.state.data?.pages[0]?.videos.length === 0 &&
      state.state.dataUpdateCount <= PREPARING_RETRIES
        ? PREPARING_RETRY_MS
        : false,
  });
  const isPreparing = usePreparingWindow(
    !empty && filter === "all" && query.isSuccess && query.data.pages[0]?.videos.length === 0,
    query.dataUpdatedAt,
    PREPARING_RETRY_MS * PREPARING_RETRIES,
  );

  useEffect(() => {
    if (
      query.error instanceof ApiError &&
      ["subscription_feed_invalid_cursor", "subscription_feed_stale_generation"].includes(
        query.error.code ?? "",
      )
    ) {
      void queryClient.resetQueries({
        queryKey: subscriptionFeedQueryOptions(filter).queryKey,
        exact: true,
      });
    }
  }, [query.error, queryClient, filter]);

  const streams = useMemo(
    () =>
      (query.data?.pages ?? [])
        .flatMap((page) => page.videos)
        .map((video) => {
          const mapped = mapVideoItem(video);
          if (!mapped.channelAvatar && mapped.channelUrl) {
            const avatar = avatarMap.get(mapped.channelUrl);
            if (avatar) return { ...mapped, channelAvatar: avatar };
          }
          return mapped;
        }),
    [query.data, avatarMap],
  );

  return {
    streams: empty ? [] : streams,
    isPreparing,
    isLoading: !empty && query.isLoading,
    isLoadingError: !empty && query.isLoadingError,
    isFetchNextPageError: !empty && query.isFetchNextPageError,
    isFetchingNextPage: query.isFetchingNextPage,
    hasNextPage: !empty && query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    refetch: query.refetch,
    error: empty ? null : query.error,
  };
}
