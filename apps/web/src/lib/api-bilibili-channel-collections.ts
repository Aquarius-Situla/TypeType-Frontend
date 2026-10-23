import type { VideoItem } from "../types/api";
import type { PublicPlaylistResponse } from "../types/playlist";
import { request } from "./api";
import { API_BASE as BASE } from "./env";
import { proxyImage } from "./proxy";

type BilibiliSeasonOrSeriesMeta = {
  season_id?: number;
  series_id?: number;
  mid: number;
  name?: string;
  title?: string;
  cover?: string;
  description?: string;
  total?: number;
};

type BilibiliArchiveItem = {
  aid: number;
  bvid: string;
  title: string;
  pic: string;
  duration: number;
  pubdate?: number;
  author?: string;
  play?: number;
  desc?: string;
  stat?: {
    view?: number;
    danmaku?: number;
  };
};

type BilibiliSeasonArchivesResponse = {
  code: number;
  message: string;
  data?: {
    meta?: BilibiliSeasonOrSeriesMeta;
    page?: {
      page_num: number;
      page_size: number;
      total: number;
    };
    archives?: BilibiliArchiveItem[];
  };
};

type BilibiliSeriesArchivesResponse = {
  code: number;
  message: string;
  data?: {
    meta?: BilibiliSeasonOrSeriesMeta;
    page?: {
      num: number;
      size: number;
      total: number;
    };
    archives?: BilibiliArchiveItem[];
  };
};

type BilibiliRecArchivesResponse = {
  code: number;
  message: string;
  data?: {
    page?: {
      num: number;
      size: number;
      total: number;
    };
    archives?: BilibiliArchiveItem[];
  };
};

type BilibiliCardData = {
  card?: {
    mid?: string;
    name?: string;
    face?: string;
    sign?: string;
    fans?: number;
    official_verify?: {
      type?: number;
      desc?: string;
    };
  };
  space?: {
    s_img?: string;
    l_img?: string;
  };
};

export async function fetchBilibiliChannelMeta(mid: string): Promise<{
  name: string;
  description: string;
  avatarUrl: string;
  bannerUrl: string;
  subscriberCount: number;
  isVerified: boolean;
} | null> {
  if (!mid) return null;
  try {
    const url = `${BASE}/bilibili/x/web-interface/card?mid=${encodeURIComponent(mid)}`;
    const res = await request<{ code: number; data?: BilibiliCardData }>(url);
    const card = res.data?.card;
    if (!card) return null;
    const name = card.name || "";
    const description = card.sign || "";
    const avatarUrl = card.face ? proxyImage(card.face) : "";
    const rawBanner = res.data?.space?.l_img || res.data?.space?.s_img || "";
    const bannerUrl = rawBanner ? proxyImage(rawBanner) : "";
    const subscriberCount = typeof card.fans === "number" ? card.fans : 0;
    const isVerified = Boolean(card.official_verify && card.official_verify.type !== -1);
    return {
      name,
      description,
      avatarUrl,
      bannerUrl,
      subscriberCount,
      isVerified,
    };
  } catch {
    return null;
  }
}

async function fetchBilibiliUploaderName(mid: string): Promise<string> {
  if (!mid) return "";
  try {
    const meta = await fetchBilibiliChannelMeta(mid);
    return meta?.name || "";
  } catch {
    return "";
  }
}

function toVideoItem(archive: BilibiliArchiveItem, uploaderName = "", uploaderUrl = ""): VideoItem {
  const bvid = archive.bvid;
  const url = `https://www.bilibili.com/video/${bvid}`;
  const pubMs = archive.pubdate ? archive.pubdate * 1000 : null;
  const views = archive.stat?.view ?? (typeof archive.play === "number" ? archive.play : 0);

  return {
    id: url,
    title: archive.title,
    url,
    thumbnailUrl: archive.pic ? proxyImage(archive.pic) : "",
    uploaderName: archive.author || uploaderName,
    uploaderUrl,
    uploaderAvatarUrl: "",
    uploaderVerified: false,
    duration: archive.duration,
    viewCount: views,
    publishedAt: pubMs,
    uploadDate: pubMs ? new Date(pubMs).toISOString() : "",
    uploaded: pubMs ?? 0,
    streamType: "video_stream",
    isLive: false,
    isPostLive: false,
    isLiveContent: false,
    requiresMembership: false,
    isShortFormContent: false,
    shortDescription: archive.desc ?? null,
  };
}

export function extractBilibiliChannelMid(channelUrl: string): string | null {
  try {
    const raw = channelUrl.trim();
    if (/^\d+$/.test(raw)) return raw;
    const withProto =
      raw.startsWith("http://") || raw.startsWith("https://") ? raw : `https://${raw}`;
    const parsed = new URL(withProto);
    const host = parsed.hostname.toLowerCase();
    if (host === "space.bilibili.com") {
      const id = parsed.pathname.split("/").filter(Boolean)[0];
      return id && /^\d+$/.test(id) ? id : null;
    }
    if (host === "www.bilibili.com" || host === "bilibili.com") {
      const segments = parsed.pathname.split("/").filter(Boolean);
      if (segments[0] === "space" && segments[1] && /^\d+$/.test(segments[1])) {
        return segments[1];
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function isBilibiliCollectionUrl(url: string): boolean {
  if (!url) return false;
  return (
    url.startsWith("bilibili:season:") ||
    url.startsWith("bilibili:series:") ||
    url.startsWith("season:") ||
    url.startsWith("series:") ||
    url.includes("business=space_collection") ||
    url.includes("business=space_series") ||
    url.includes("/channel/seriesdetail") ||
    url.includes("/channel/collectiondetail")
  );
}

export function parseBilibiliCollectionParams(url: string): {
  kind: "season" | "series";
  mid: string;
  id: string;
} | null {
  try {
    const trimmed = url.trim();
    if (trimmed.startsWith("bilibili:season:")) {
      const parts = trimmed.split(":");
      return {
        kind: "season",
        mid: parts.length >= 4 ? parts[2] : "",
        id: parts[parts.length - 1] ?? "",
      };
    }
    if (trimmed.startsWith("bilibili:series:")) {
      const parts = trimmed.split(":");
      return {
        kind: "series",
        mid: parts.length >= 4 ? parts[2] : "",
        id: parts[parts.length - 1] ?? "",
      };
    }
    if (trimmed.startsWith("season:")) {
      const parts = trimmed.split(":");
      return {
        kind: "season",
        mid: parts.length >= 3 ? parts[1] : "",
        id: parts[parts.length - 1] ?? "",
      };
    }
    if (trimmed.startsWith("series:")) {
      const parts = trimmed.split(":");
      return {
        kind: "series",
        mid: parts.length >= 3 ? parts[1] : "",
        id: parts[parts.length - 1] ?? "",
      };
    }

    const parsed = new URL(trimmed);
    const business = parsed.searchParams.get("business");
    const businessId = parsed.searchParams.get("business_id");
    const segments = parsed.pathname.split("/").filter(Boolean);
    const midFromPath = segments.find((s) => /^\d+$/.test(s)) ?? "";
    const midFromParam = parsed.searchParams.get("mid");
    const mid = midFromParam || midFromPath;

    if (business === "space_collection" && businessId) {
      return { kind: "season", mid, id: businessId };
    }
    if (business === "space_series" && businessId) {
      return { kind: "series", mid, id: businessId };
    }

    const sidParam = parsed.searchParams.get("sid");
    if (parsed.pathname.includes("collectiondetail") && sidParam) {
      return { kind: "season", mid, id: sidParam };
    }
    if (parsed.pathname.includes("seriesdetail") && sidParam) {
      return { kind: "series", mid, id: sidParam };
    }

    return null;
  } catch {
    return null;
  }
}

export function toCanonicalBilibiliCollectionUrl(url: string): string {
  const parsed = parseBilibiliCollectionParams(url);
  if (!parsed) return url;
  const business = parsed.kind === "series" ? "space_series" : "space_collection";
  const midSegment = parsed.mid ? `${parsed.mid}` : "";
  return `https://www.bilibili.com/medialist/play/${midSegment}?business=${business}&business_id=${parsed.id}`;
}

export async function fetchBilibiliCollectionEpisodes(
  collectionUrlOrId: string,
  nextpage?: string,
): Promise<PublicPlaylistResponse> {
  const parsed = parseBilibiliCollectionParams(collectionUrlOrId);
  if (!parsed) {
    throw new Error("Invalid Bilibili collection URL or ID");
  }

  const pageNum = nextpage ? Number(nextpage) || 1 : 1;
  const pageSize = 30;

  if (parsed.kind === "season") {
    const url = `${BASE}/bilibili/x/polymer/web-space/seasons_archives_list?mid=${encodeURIComponent(parsed.mid)}&season_id=${encodeURIComponent(parsed.id)}&sort_reverse=false&page_num=${pageNum}&page_size=${pageSize}`;
    const [res, uploaderName] = await Promise.all([
      request<BilibiliSeasonArchivesResponse>(url),
      fetchBilibiliUploaderName(parsed.mid),
    ]);
    if (res.code !== 0) {
      throw new Error(res.message || `Bilibili season error: ${res.code}`);
    }
    const data = res.data;
    const archives = data?.archives ?? [];
    const meta = data?.meta;
    const title = meta?.name || meta?.title || "合集";
    const rawCover = meta?.cover || archives[0]?.pic || "";
    const cover = rawCover ? proxyImage(rawCover) : "";
    const total = meta?.total ?? archives.length;
    const uploaderUrl = parsed.mid ? `https://space.bilibili.com/${parsed.mid}` : "";

    const videos = archives.map((archive) => toVideoItem(archive, uploaderName, uploaderUrl));
    const page = data?.page;
    const hasMore = page ? page.page_num * page.page_size < page.total : false;

    return {
      playlist: {
        id: `bilibili:season:${parsed.mid}:${parsed.id}`,
        url: collectionUrlOrId,
        title,
        thumbnailUrl: cover,
        uploaderName,
        streamCount: total,
        playlistType: "collection",
      },
      videos,
      nextpage: hasMore ? String(pageNum + 1) : null,
    };
  }

  const url = `${BASE}/bilibili/x/series/archives?mid=${encodeURIComponent(parsed.mid)}&series_id=${encodeURIComponent(parsed.id)}&only_normal=true&sort=asc&pn=${pageNum}&ps=${pageSize}`;
  const [res, uploaderName] = await Promise.all([
    request<BilibiliSeriesArchivesResponse>(url),
    fetchBilibiliUploaderName(parsed.mid),
  ]);
  if (res.code !== 0) {
    throw new Error(res.message || `Bilibili series error: ${res.code}`);
  }
  const data = res.data;
  const archives = data?.archives ?? [];
  const meta = data?.meta;
  const title = meta?.name || meta?.title || "系列";
  const rawCover = meta?.cover || archives[0]?.pic || "";
  const cover = rawCover ? proxyImage(rawCover) : "";
  const total = meta?.total ?? archives.length;
  const uploaderUrl = parsed.mid ? `https://space.bilibili.com/${parsed.mid}` : "";

  const videos = archives.map((archive) => toVideoItem(archive, uploaderName, uploaderUrl));
  const page = data?.page;
  const hasMore = page ? page.num * page.size < page.total : false;

  return {
    playlist: {
      id: `bilibili:series:${parsed.mid}:${parsed.id}`,
      url: collectionUrlOrId,
      title,
      thumbnailUrl: cover,
      uploaderName,
      streamCount: total,
      playlistType: "series",
    },
    videos,
    nextpage: hasMore ? String(pageNum + 1) : null,
  };
}

export async function fetchBilibiliChannelSearch(
  mid: string,
  keyword: string,
  nextpage?: string,
): Promise<{ videos: VideoItem[]; nextpage: string | null }> {
  const pageNum = nextpage ? Number(nextpage) || 1 : 1;
  const pageSize = 30;
  const url = `${BASE}/bilibili/x/series/recArchivesByKeywords?mid=${encodeURIComponent(mid)}&keywords=${encodeURIComponent(keyword)}&pn=${pageNum}&ps=${pageSize}`;

  const [res, uploaderName] = await Promise.all([
    request<BilibiliRecArchivesResponse>(url),
    fetchBilibiliUploaderName(mid),
  ]);
  if (res.code !== 0) {
    throw new Error(res.message || `Bilibili channel search error: ${res.code}`);
  }
  const data = res.data;
  const archives = data?.archives ?? [];
  const uploaderUrl = `https://space.bilibili.com/${mid}`;
  const videos = archives.map((archive) => toVideoItem(archive, uploaderName, uploaderUrl));
  const page = data?.page;
  const hasMore = page ? page.num * page.size < page.total : false;

  return {
    videos,
    nextpage: hasMore ? String(pageNum + 1) : null,
  };
}
