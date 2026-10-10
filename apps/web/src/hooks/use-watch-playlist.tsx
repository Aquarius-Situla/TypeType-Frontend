import { useNavigate } from "@tanstack/react-router";
import { type ReactNode, useCallback, useEffect, useMemo } from "react";
import { WatchPlaylistPanel } from "../components/watch-playlist-panel";
import { applyCustomOrder, randomShuffleSeed, shuffleByKey } from "../lib/playlist-shuffle";
import { extractEpisodeNumber } from "../lib/playlist-sort";
import { isManagedPlaylistId } from "../lib/playlist-url";
import {
  activeStreamCollection,
  deriveSectionsFromVideos,
  getSubscribedCollectionMeta,
  isCollectionPlaylist,
  type SubscribedCollectionSectionMeta,
  streamCollectionPlaylistItems,
  streamCollectionSectionGroups,
} from "../lib/stream-collections";
import { streamPartPlaylistItems } from "../lib/stream-parts";
import { markWatchAutoplayIntent } from "../lib/watch-autoplay-intent";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import { usePlaylistOrderStore } from "../stores/playlist-order-store";
import type { WatchPlaylistItem } from "../types/playlist";
import type { StreamCollectionItem } from "../types/stream-collection";
import type { StreamPartItem } from "../types/stream-parts";
import { useBlockedFilter } from "./use-blocked-filter";
import { usePlaylist } from "./use-playlist";
import { usePlaylists } from "./use-playlists";
import { usePublicPlaylist } from "./use-public-playlist";

const MISSING_CURRENT_PREFETCH_LIMIT = 5;
const PREFETCH_REMAINING_ITEMS = 10;

type WatchPlaylist = {
  nextParam: string | null;
  nextVideo: WatchPlaylistItem | null;
  playPrevious?: () => void;
  playNext?: () => void;
  panel: ReactNode;
};

export function useWatchPlaylist(
  list: string | undefined,
  shuffle: string | undefined,
  currentParam: string,
  collections?: StreamCollectionItem[],
  parts?: StreamPartItem[],
): WatchPlaylist {
  const navigate = useNavigate();
  const { filter } = useBlockedFilter();
  const managedList = list && isManagedPlaylistId(list) ? list : "";
  const publicListUrl =
    list && !isManagedPlaylistId(list) ? `https://www.youtube.com/playlist?list=${list}` : "";
  const managedPlaylist = usePlaylist(managedList);
  const publicPlaylist = usePublicPlaylist(publicListUrl);
  const { reorder } = usePlaylists();
  const setOrder = usePlaylistOrderStore((state) => state.setOrder);
  const customOrder = usePlaylistOrderStore((state) => (list ? state.orders[list] : undefined));
  const isManaged = managedList.length > 0;
  const collection = activeStreamCollection(collections, currentParam);
  const collectionVideos = streamCollectionPlaylistItems(collection);
  const collectionSections = streamCollectionSectionGroups(collection).map((sec) => ({
    ...sec,
    videos: filter(sec.videos),
  }));
  const partVideos = streamPartPlaylistItems(parts);
  const name = isManaged
    ? (managedPlaylist.data?.name ?? "")
    : (publicPlaylist.data?.pages[0]?.playlist.title ??
      collection?.title ??
      (partVideos.length > 0 ? m.ui_video_parts() : ""));
  const isManagedCollection = Boolean(
    isManaged && managedPlaylist.data && isCollectionPlaylist(managedPlaylist.data),
  );
  const managedCollectionMeta =
    isManagedCollection && managedList ? getSubscribedCollectionMeta(managedList) : undefined;
  const plVideos = managedPlaylist.data?.videos ?? [];
  const managedVideos = useMemo(() => {
    if (!isManagedCollection || !managedCollectionMeta?.sections) return plVideos;
    const metaEpisodes = managedCollectionMeta.sections.flatMap((sec) => sec.episodes ?? []);
    if (metaEpisodes.length === 0) return plVideos;
    const seen = new Set<string>();
    const res: typeof plVideos = [];
    for (const v of plVideos) {
      if (v.url && !seen.has(v.url)) {
        seen.add(v.url);
        res.push(v);
      }
    }
    for (const ep of metaEpisodes) {
      if (ep.url && !seen.has(ep.url)) {
        seen.add(ep.url);
        res.push({
          id: ep.videoId || ep.url,
          url: ep.url,
          title: ep.title,
          thumbnail: ep.thumbnailUrl ?? "",
          channelName: ep.channelName ?? plVideos[0]?.channelName ?? "",
          channelUrl: "",
          channelAvatar: "",
          viewCount: 0,
          duration: 0,
          position: res.length,
          watchPosition: 0,
          watched: false,
          progressUpdatedAt: 0,
        });
      }
    }
    return res;
  }, [plVideos, isManagedCollection, managedCollectionMeta]);
  const sortedManagedVideos = isManagedCollection
    ? [...managedVideos].sort((a, b) => {
        const numA = extractEpisodeNumber(a.title);
        const numB = extractEpisodeNumber(b.title);
        if (numA !== null && numB !== null) {
          if (numA !== numB) return numA - numB;
        } else if (numA !== null) {
          return -1;
        } else if (numB !== null) {
          return 1;
        }
        if (a.position !== b.position) return a.position - b.position;
        return (a.title ?? "").localeCompare(b.title ?? "", "zh-Hans-CN", { numeric: true });
      })
    : managedVideos;
  const base: WatchPlaylistItem[] = isManaged
    ? sortedManagedVideos.map((item: (typeof plVideos)[number]) => ({
        key: item.id,
        url: item.url,
        title: item.title,
        thumbnail: item.thumbnail,
        channelName: item.channelName,
        channelUrl: item.channelUrl,
      }))
    : (publicPlaylist.data?.pages.flatMap((page) => page.streams) ?? []).length > 0
      ? (publicPlaylist.data?.pages.flatMap((page) => page.streams) ?? []).map((item, index) => ({
          key: `${index}-${item.id}`,
          url: item.id,
          title: item.title,
          thumbnail: item.thumbnail,
          channelName: item.channelName,
          channelUrl: item.channelUrl,
        }))
      : collectionVideos.length > 0
        ? collectionVideos
        : partVideos;
  const visibleBase = filter(base);
  const arranged =
    !isManaged && customOrder ? applyCustomOrder(visibleBase, customOrder) : visibleBase;
  const videos = shuffle ? shuffleByKey(arranged, shuffle) : arranged;
  const inPlaylist =
    (Boolean(list) || Boolean(collection) || partVideos.length > 0) && videos.length > 0;
  const currentIdx = inPlaylist
    ? videos.findIndex((video) => toPublicWatchParam(video.url) === currentParam)
    : -1;
  const loadedPublicPageCount = publicPlaylist.data?.pages.length ?? 0;
  const canLoadPublicPage =
    !isManaged && Boolean(publicPlaylist.hasNextPage) && !publicPlaylist.isFetchingNextPage;
  const loadMorePublic = useCallback(() => {
    if (canLoadPublicPage) void publicPlaylist.fetchNextPage();
  }, [canLoadPublicPage, publicPlaylist.fetchNextPage]);
  const previousVideo = currentIdx > 0 ? videos[currentIdx - 1] : undefined;
  const nextVideo = currentIdx >= 0 ? videos[currentIdx + 1] : undefined;
  const previousParam = previousVideo ? toPublicWatchParam(previousVideo.url) : null;
  const nextParam = nextVideo ? toPublicWatchParam(nextVideo.url) : null;
  const playPrevious = useCallback(() => {
    if (!previousParam) return;
    markWatchAutoplayIntent();
    navigate({
      to: "/watch",
      search: { v: previousParam, list, ...(shuffle ? { shuffle } : {}) },
      resetScroll: false,
    });
  }, [previousParam, list, shuffle, navigate]);
  const playNext = useCallback(() => {
    if (!nextParam) return;
    markWatchAutoplayIntent();
    navigate({
      to: "/watch",
      search: { v: nextParam, list, ...(shuffle ? { shuffle } : {}) },
      resetScroll: false,
    });
  }, [nextParam, list, shuffle, navigate]);

  useEffect(() => {
    if (!canLoadPublicPage || videos.length === 0) return;
    const missingCurrent = currentIdx < 0 && loadedPublicPageCount < MISSING_CURRENT_PREFETCH_LIMIT;
    const nearEnd = currentIdx >= 0 && currentIdx >= videos.length - PREFETCH_REMAINING_ITEMS;
    if (missingCurrent || nearEnd) void publicPlaylist.fetchNextPage();
  }, [
    canLoadPublicPage,
    currentIdx,
    loadedPublicPageCount,
    videos.length,
    publicPlaylist.fetchNextPage,
  ]);

  const effectiveSections =
    collectionSections.length > 1
      ? collectionSections
      : managedCollectionMeta?.sections && managedCollectionMeta.sections.length > 1
        ? managedCollectionMeta.sections.map((sec: SubscribedCollectionSectionMeta) => ({
            id: sec.id,
            title: sec.title,
            videos: filter(
              sec.episodes && sec.episodes.length > 0
                ? sec.episodes.map((ep) => ({
                    key: ep.videoId || ep.url,
                    url: ep.url,
                    title: ep.title,
                    thumbnail: ep.thumbnailUrl ?? "",
                    channelName: ep.channelName,
                  }))
                : videos.filter((v) => sec.videoUrls.includes(v.url.trim())),
            ),
          }))
        : isManagedCollection
          ? deriveSectionsFromVideos(videos).map((sec: SubscribedCollectionSectionMeta) => ({
              id: sec.id,
              title: sec.title,
              videos: filter(videos.filter((v) => sec.videoUrls.includes(v.url.trim()))),
            }))
          : undefined;

  const panel =
    inPlaylist && (list || collection || partVideos.length > 0) ? (
      <WatchPlaylistPanel
        name={name}
        videos={videos}
        sections={effectiveSections && !shuffle ? effectiveSections : undefined}
        listId={list}
        currentParam={currentParam}
        shuffle={shuffle}
        isLoadingMore={publicPlaylist.isFetchingNextPage}
        onLoadMore={canLoadPublicPage ? loadMorePublic : undefined}
        onToggleShuffle={
          list || collection
            ? () =>
                navigate({
                  to: "/watch",
                  search: {
                    v: currentParam,
                    list,
                    ...(shuffle ? {} : { shuffle: randomShuffleSeed() }),
                  },
                  resetScroll: false,
                })
            : undefined
        }
        onReorder={(items) => {
          if (isManaged && list) {
            const reordered = [...items];
            const visibleKeys = new Set(visibleBase.map((item) => item.key));
            const fullOrder = base.map((item) =>
              visibleKeys.has(item.key) ? (reordered.shift() ?? item).url : item.url,
            );
            reorder.mutate({ id: list, order: fullOrder });
          } else if (list)
            setOrder(
              list,
              items.map((v) => v.key),
            );
          if (shuffle) {
            navigate({ to: "/watch", search: { v: currentParam, list }, resetScroll: false });
          }
        }}
      />
    ) : null;

  return {
    nextParam,
    nextVideo: nextVideo ?? null,
    playPrevious: previousParam ? playPrevious : undefined,
    playNext: nextParam ? playNext : undefined,
    panel,
  };
}
