import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import {
  extractBilibiliChannelMid,
  fetchBilibiliChannelMeta,
  fetchBilibiliChannelSearch,
} from "../lib/api-bilibili-channel-collections";
import { type ChannelSort, fetchChannel } from "../lib/api-discovery";
import { buildChannelRequestUrl } from "../lib/channel-search-url";
import { mapVideoItem } from "../lib/mappers";
import { detectProvider } from "../lib/provider";
import { proxyImage } from "../lib/proxy";
import type { VideoStream } from "../types/stream";

type ChannelMeta = {
  name: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  subscriberCount: number;
  isVerified: boolean;
};

type ChannelPage = {
  meta: ChannelMeta | null;
  videos: VideoStream[];
  nextpage: string | null;
};

type CachedChannelMeta = {
  channelUrl: string;
  meta: ChannelMeta;
};

export function useChannel(
  channelUrl: string,
  sort: ChannelSort,
  searchQuery: string,
  live: boolean,
) {
  const lastMeta = useRef<CachedChannelMeta | null>(null);
  const provider = detectProvider(channelUrl);
  const trimmedQuery = searchQuery.trim();
  const isBilibiliSearch = provider === "bilibili" && trimmedQuery.length > 0;
  const bilibiliMid = isBilibiliSearch ? extractBilibiliChannelMid(channelUrl) : null;
  const requestUrl = buildChannelRequestUrl(channelUrl, searchQuery, live);

  const channelQuery = useInfiniteQuery({
    queryKey: ["channel", channelUrl, sort, searchQuery, live],
    queryFn: async ({ pageParam }): Promise<ChannelPage> => {
      const isFirstPage = pageParam === undefined;
      if (isBilibiliSearch && bilibiliMid) {
        const [res, channelMeta] = await Promise.all([
          fetchBilibiliChannelSearch(
            bilibiliMid,
            trimmedQuery,
            pageParam as string | undefined,
          ),
          isFirstPage && !lastMeta.current ? fetchBilibiliChannelMeta(bilibiliMid) : Promise.resolve(null),
        ]);
        return {
          meta: channelMeta,
          videos: res.videos.map(mapVideoItem),
          nextpage: res.nextpage,
        };
      }

      const res = await fetchChannel(requestUrl, pageParam as string | undefined, sort);
      const isFirstPage = pageParam === undefined;
      return {
        meta: isFirstPage
          ? {
              name: res.name,
              description: res.description,
              avatarUrl: proxyImage(res.avatarUrl),
              bannerUrl: proxyImage(res.bannerUrl),
              subscriberCount: res.subscriberCount,
              isVerified: res.isVerified,
            }
          : null,
        videos: res.videos.map(mapVideoItem),
        nextpage: res.nextpage,
      };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ChannelPage | undefined) => last?.nextpage ?? undefined,
    enabled: channelUrl.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const pages = channelQuery.data?.pages ?? [];
  const currentMeta = pages.find((p) => p.meta !== null)?.meta ?? null;
  const cachedMeta = lastMeta.current?.channelUrl === channelUrl ? lastMeta.current.meta : null;
  const meta = currentMeta ?? cachedMeta;
  const avatarUrl = meta?.avatarUrl ?? "";
  const videos = pages.flatMap((p) =>
    p.videos.map((v) => (v.channelAvatar || !avatarUrl ? v : { ...v, channelAvatar: avatarUrl })),
  );

  useEffect(() => {
    if (currentMeta) lastMeta.current = { channelUrl, meta: currentMeta };
  }, [channelUrl, currentMeta]);

  return { ...channelQuery, meta, videos };
}
