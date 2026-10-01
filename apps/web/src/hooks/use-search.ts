import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchSearch } from "../lib/api-discovery";
import { mapVideoItem } from "../lib/mappers";
import type { ChannelResultItem } from "../types/api";
import type { PublicPlaylistInfo } from "../types/playlist";
import type { VideoStream } from "../types/stream";

type SearchPage = {
  streams: VideoStream[];
  channels: ChannelResultItem[];
  playlists: PublicPlaylistInfo[];
  nextpage: string | null;
  searchSuggestion: string | null;
  isCorrectedSearch: boolean;
};

const COPYCAT_KEYWORDS = [
  "录屏",
  "搬运",
  "高仿",
  "粉丝",
  "二创",
  "后援",
  "法务部",
  "切片",
  "备份",
  "小号",
  "更新了吗",
  "更新了没",
  "bot",
  "铁杆",
  "爱玩",
  "野生",
  "非官方",
];

export function pickTopBilibiliChannels(
  channels: readonly ChannelResultItem[],
  query: string,
  limit = 1,
): ChannelResultItem[] {
  if (channels.length === 0) return [];
  const normalizedQuery = query.replace(/\s+/g, "").toLowerCase();
  if (!normalizedQuery) return channels.slice(0, limit);

  const scored = channels
    .map((channel) => {
      const normalizedName = channel.name.replace(/\s+/g, "").toLowerCase();
      let matchScore = 0;
      if (normalizedName === normalizedQuery) {
        matchScore = 100;
      } else if (normalizedName.startsWith(normalizedQuery)) {
        matchScore = 75;
      } else if (normalizedName.endsWith(normalizedQuery)) {
        matchScore = 65;
      } else if (normalizedName.includes(normalizedQuery)) {
        matchScore = 45;
      } else if (normalizedQuery.includes(normalizedName)) {
        matchScore = 35;
      } else {
        return null;
      }

      const subs = Math.max(channel.subscriberCount ?? 0, 0);
      const subsScore = Math.log10(subs + 1) * 15;

      const hasCopycat = COPYCAT_KEYWORDS.some(
        (kw) => normalizedName.includes(kw) && !normalizedQuery.includes(kw),
      );
      const copycatPenalty = hasCopycat ? 60 : 0;
      const verifiedBonus = channel.isVerified ? 25 : 0;

      const totalScore = matchScore + subsScore + verifiedBonus - copycatPenalty;

      const isExact = matchScore === 100;
      const hasEnoughSubs = isExact
        ? subs >= 1000 || channel.isVerified
        : subs >= 50000 || channel.isVerified;

      if (!hasEnoughSubs) {
        return null;
      }

      return { channel, score: totalScore, subs };
    })
    .filter(
      (item): item is { channel: ChannelResultItem; score: number; subs: number } => item !== null,
    );

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, limit).map((item) => item.channel);
}

export function useSearch(
  q: string,
  service: number,
  contentFilter?: string,
  filters: readonly string[] = [],
) {
  return useInfiniteQuery({
    queryKey: ["search", q, service, contentFilter ?? "", filters],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const isBilibiliDefaultSearch = service === 5 && !contentFilter && !pageParam;

      const [response, bilibiliChannelResp] = await Promise.all([
        fetchSearch(q, service, pageParam, contentFilter, filters),
        isBilibiliDefaultSearch
          ? fetchSearch(q, service, undefined, "|2|channels").catch(() => null)
          : Promise.resolve(null),
      ]);

      let channels = response.channels ?? [];
      if (channels.length === 0 && bilibiliChannelResp?.channels) {
        channels = pickTopBilibiliChannels(bilibiliChannelResp.channels, q, 1);
      }

      return {
        streams: response.items.map(mapVideoItem),
        channels,
        playlists: response.playlists ?? [],
        nextpage: response.nextpage,
        searchSuggestion: response.searchSuggestion,
        isCorrectedSearch: response.isCorrectedSearch,
      } satisfies SearchPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: SearchPage) => {
      const isEmpty =
        last.streams.length === 0 && last.channels.length === 0 && last.playlists.length === 0;
      return isEmpty ? undefined : (last.nextpage ?? undefined);
    },
    enabled: q.length > 0,
  });
}
