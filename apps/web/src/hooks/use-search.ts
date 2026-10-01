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
  "字幕组",
];

const OFFICIAL_REGEX = /官方|公式|official/i;

function isOfficialChannel(channel: ChannelResultItem): boolean {
  return Boolean(channel.isVerified || OFFICIAL_REGEX.test(channel.name));
}

export function getBilibiliQueryVariations(q: string): string[] {
  const trimmed = q.trim();
  const words = trimmed.split(/\s+/);
  if (words.length <= 1 || !/^[a-zA-Z0-9\s_-]+$/.test(trimmed)) {
    return [];
  }
  const variations: string[] = [];
  const firstWord = words[0];
  if (!firstWord.toLowerCase().endsWith("s")) {
    variations.push([`${firstWord}s`, ...words.slice(1)].join(" "));
  }
  variations.push(words.join(""));
  if (!firstWord.toLowerCase().endsWith("s")) {
    variations.push([`${firstWord}s`, ...words.slice(1)].join(""));
  }
  return variations;
}

export async function fetchBilibiliCandidateChannels(
  q: string,
  service: number,
): Promise<ChannelResultItem[]> {
  try {
    const res = await fetchSearch(q, service, undefined, "|2|channels");
    if (res.channels && res.channels.length > 0) {
      return res.channels;
    }
  } catch {
    // ignore
  }

  const variations = getBilibiliQueryVariations(q);
  for (const v of variations) {
    try {
      const vRes = await fetchSearch(v, service, undefined, "|2|channels");
      if (vRes.channels && vRes.channels.length > 0) {
        return vRes.channels;
      }
    } catch {
      // ignore
    }
  }

  return [];
}

export function pickTopBilibiliChannels(
  channels: readonly ChannelResultItem[],
  query: string,
  limit = 1,
): ChannelResultItem[] {
  if (channels.length === 0) return [];
  const normalizedQuery = query.replace(/\s+/g, "").toLowerCase();
  if (!normalizedQuery) return channels.slice(0, limit);

  const scored = channels
    .map((channel, index) => {
      const normalizedName = channel.name.replace(/\s+/g, "").toLowerCase();
      const normalizedDesc = (channel.description ?? "").replace(/\s+/g, "").toLowerCase();
      const subs = Math.max(channel.subscriberCount ?? 0, 0);
      const isOfficial = isOfficialChannel(channel);

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
      } else if (normalizedQuery.length >= 2 && normalizedDesc.includes(normalizedQuery)) {
        matchScore = 60;
      } else if (index === 0 && isOfficial && subs >= 5000) {
        // Bilibili rank #1 official / 公式 channel for alias/translation (e.g. "水果拉链" -> FRUITSZIPPER_公式)
        matchScore = 80;
      } else if (index === 0 && subs >= 1000000) {
        // Dominant creator ranked #1 by Bilibili algorithm for known community alias (e.g. "蕾丝" -> LexBurner)
        matchScore = 70;
      } else {
        return null;
      }

      const subsScore = Math.log10(subs + 1) * 15;

      const hasCopycat = COPYCAT_KEYWORDS.some(
        (kw) => normalizedName.includes(kw) && !normalizedQuery.includes(kw),
      );
      if (hasCopycat && matchScore <= 60) {
        return null;
      }
      const copycatPenalty = hasCopycat ? 60 : 0;
      const verifiedBonus = isOfficial ? 25 : 0;
      const indexBonus = index === 0 ? 15 : 0;

      const totalScore = matchScore + subsScore + verifiedBonus + indexBonus - copycatPenalty;

      const isExact = matchScore === 100;
      const hasEnoughSubs = isOfficial ? subs >= 3000 : isExact ? subs >= 1000 : subs >= 25000;

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

      const [response, bilibiliChannels] = await Promise.all([
        fetchSearch(q, service, pageParam, contentFilter, filters),
        isBilibiliDefaultSearch ? fetchBilibiliCandidateChannels(q, service) : Promise.resolve([]),
      ]);

      let channels = response.channels ?? [];
      if (channels.length === 0 && bilibiliChannels.length > 0) {
        channels = pickTopBilibiliChannels(bilibiliChannels, q, 1);
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
