import type { PublicPlaylistInfo } from "../types/playlist";
import type { VideoStream } from "../types/stream";
import { isBilibiliSeasonUrl, isBilibiliSeriesUrl } from "./api-bilibili-channel-collections";
import type { SubscribedCollectionSectionMeta } from "./stream-collections";
import { toPublicWatchParam } from "./watch-url";

export function isPublicBilibiliCollection(playlistUrl: string, playlistType?: string): boolean {
  const type = (playlistType ?? "").toLowerCase();
  if (isBilibiliSeriesUrl(playlistUrl) || type === "series") {
    return false;
  }
  return (
    isBilibiliSeasonUrl(playlistUrl) ||
    type === "collection" ||
    type === "season" ||
    type === "ugc_season"
  );
}

export function buildLoadedStreamParamSet(rawStreams: VideoStream[]): Set<string> {
  const params = new Set<string>();
  for (const s of rawStreams) {
    params.add(toPublicWatchParam(s.id));
    params.add(s.id);
  }
  return params;
}

export function resolvePublicPlaylistStreams({
  streams,
  activeSection,
  info,
  filter,
}: {
  streams: VideoStream[];
  activeSection: SubscribedCollectionSectionMeta | undefined;
  info: PublicPlaylistInfo | undefined;
  filter: <
    T extends {
      title?: string;
      channelName?: string;
      channelUrl?: string;
      url?: string;
      id?: string;
    },
  >(
    items: T[],
  ) => T[];
}): VideoStream[] {
  if (!activeSection) {
    return streams;
  }

  if (activeSection.episodes && activeSection.episodes.length > 0) {
    const streamsByParam = new Map<string, VideoStream>();
    for (const s of streams) {
      streamsByParam.set(toPublicWatchParam(s.id), s);
      streamsByParam.set(s.id, s);
    }

    const fallbackChannelAvatar = streams[0]?.channelAvatar ?? "";
    const fallbackRawAvatar = streams[0]?.rawChannelAvatar ?? "";
    const fallbackChannelUrl = streams[0]?.channelUrl ?? "";
    const fallbackChannelName = info?.uploaderName || streams[0]?.channelName || "";

    const mapped = activeSection.episodes.map((ep) => {
      const existing =
        streamsByParam.get(toPublicWatchParam(ep.url)) ||
        streamsByParam.get(ep.url) ||
        (ep.videoId ? streamsByParam.get(ep.videoId) : undefined);
      if (existing) return existing;

      return {
        id: ep.url,
        title: ep.title,
        thumbnail: ep.thumbnailUrl ?? "",
        rawThumbnail: ep.thumbnailUrl ?? "",
        rawChannelAvatar: fallbackRawAvatar,
        channelName: ep.channelName || fallbackChannelName,
        channelUrl: fallbackChannelUrl,
        channelAvatar: fallbackChannelAvatar,
        views: 0,
        duration: 0,
      } satisfies VideoStream;
    });

    return filter(mapped);
  }

  const urlSet = new Set(activeSection.videoUrls.map((u) => toPublicWatchParam(u)));
  return streams.filter(
    (s) => urlSet.has(toPublicWatchParam(s.id)) || activeSection.videoUrls.includes(s.id),
  );
}

export function shouldEnablePublicPlaylistPagination({
  activeSection,
  loadedStreamParams,
  hasNextPage,
  isFetchingNextPage,
  isFetchNextPageError,
}: {
  activeSection: SubscribedCollectionSectionMeta | undefined;
  loadedStreamParams: Set<string>;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  isFetchNextPageError: boolean;
}): boolean {
  if (!hasNextPage || isFetchingNextPage || isFetchNextPageError) {
    return false;
  }
  if (!activeSection?.episodes || activeSection.episodes.length === 0) {
    return true;
  }
  return activeSection.episodes.some(
    (ep) => !loadedStreamParams.has(toPublicWatchParam(ep.url)) && !loadedStreamParams.has(ep.url),
  );
}
