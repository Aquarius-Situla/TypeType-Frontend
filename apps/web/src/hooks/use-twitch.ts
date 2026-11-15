import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  fetchTwitchAccount,
  fetchTwitchChannel,
  fetchTwitchChannelClips,
  fetchTwitchChannelVideos,
  fetchTwitchClip,
  fetchTwitchFollowedLive,
  fetchTwitchGameStreams,
  fetchTwitchGames,
  fetchTwitchLive,
  fetchTwitchSearch,
  fetchTwitchStreams,
  fetchTwitchTagStreams,
  fetchTwitchVideo,
} from "../lib/api-twitch";
import type { TwitchPage, TwitchSearchType } from "../types/twitch";
import { useAuth } from "./use-auth";
import { useInstance } from "./use-instance";

export function useTwitchEnabled(): boolean {
  return useInstance().data?.twitch.enabled === true;
}

function usePagedTwitch<T>(
  key: unknown[],
  fetcher: (after?: string) => Promise<TwitchPage<T>>,
  enabled = true,
) {
  const query = useInfiniteQuery({
    queryKey: ["twitch", ...key],
    queryFn: ({ pageParam }) => fetcher(pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => (last.hasMore && last.cursor ? last.cursor : undefined),
    enabled,
    staleTime: 60_000,
  });
  const items = query.data?.pages.flatMap((page) => page.items) ?? [];
  return { ...query, items };
}

export const useTwitchStreams = () =>
  usePagedTwitch(["streams"], fetchTwitchStreams, useTwitchEnabled());

export const useTwitchGames = () => usePagedTwitch(["games"], fetchTwitchGames, useTwitchEnabled());

export function useTwitchGameStreams(slug: string) {
  const enabled = useTwitchEnabled();
  const query = useInfiniteQuery({
    queryKey: ["twitch", "game", slug],
    queryFn: ({ pageParam }) => fetchTwitchGameStreams(slug, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) =>
      last.streams.hasMore && last.streams.cursor ? last.streams.cursor : undefined,
    enabled,
    staleTime: 60_000,
  });
  return {
    ...query,
    game: query.data?.pages[0]?.game ?? null,
    items: query.data?.pages.flatMap((page) => page.streams.items) ?? [],
  };
}

export const useTwitchTagStreams = (tag: string) =>
  usePagedTwitch(["tag", tag], (after) => fetchTwitchTagStreams(tag, after), useTwitchEnabled());

export const useTwitchChannelVideos = (login: string) =>
  usePagedTwitch(
    ["videos", login],
    (after) => fetchTwitchChannelVideos(login, after),
    useTwitchEnabled(),
  );

export const useTwitchChannelClips = (login: string) =>
  usePagedTwitch(
    ["clips", login],
    (after) => fetchTwitchChannelClips(login, after),
    useTwitchEnabled(),
  );

export function useTwitchSearch<T>(query: string, type: TwitchSearchType) {
  return usePagedTwitch<T>(
    ["search", type, query],
    (after) => fetchTwitchSearch<T>(query, type, after),
    useTwitchEnabled() && query.trim().length > 0,
  );
}

export function useTwitchChannel(login: string, refetchInterval?: number) {
  return useQuery({
    queryKey: ["twitch", "channel", login],
    queryFn: () => fetchTwitchChannel(login),
    enabled: useTwitchEnabled() && login.length > 0,
    staleTime: 30_000,
    refetchInterval,
  });
}

function usePlayback<T>(kind: string, id: string, fetcher: (id: string) => Promise<T>) {
  return useQuery({
    queryKey: ["twitch", "playback", kind, id],
    queryFn: () => fetcher(id),
    enabled: useTwitchEnabled() && id.length > 0,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

export const useTwitchLive = (login: string) => usePlayback("live", login, fetchTwitchLive);

export const useTwitchVideoPlayback = (id: string) => usePlayback("video", id, fetchTwitchVideo);

export const useTwitchClipPlayback = (slug: string) => usePlayback("clip", slug, fetchTwitchClip);

export function useTwitchAccount() {
  const { isAuthed, isGuest } = useAuth();
  return useQuery({
    queryKey: ["twitch", "account"],
    queryFn: fetchTwitchAccount,
    enabled: useTwitchEnabled() && isAuthed && !isGuest,
  });
}

export function useTwitchFollowedLive() {
  const account = useTwitchAccount();
  return usePagedTwitch(["followed-live"], fetchTwitchFollowedLive, account.data?.linked === true);
}
