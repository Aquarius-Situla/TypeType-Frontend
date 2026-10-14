import type { VideoItem } from "../types/api";
import type {
  ChannelPlaylistsResponse,
  PublicPlaylistInfo,
  PublicPlaylistResponse,
} from "../types/playlist";
import { request } from "./api";
import { API_BASE as BASE } from "./env";
import { optionalBearer } from "./optional-bearer";
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

type BilibiliSeasonItem = {
  meta: BilibiliSeasonOrSeriesMeta;
  archives: BilibiliArchiveItem[];
};

type BilibiliSeriesItem = {
  meta: BilibiliSeasonOrSeriesMeta;
  archives: BilibiliArchiveItem[];
};

type BilibiliSeasonsSeriesListResponse = {
  code: number;
  message: string;
  data?: {
    items_lists?: {
      page?: {
        page_num: number;
        page_size: number;
        total: number;
      };
      seasons_list?: BilibiliSeasonItem[];
      series_list?: BilibiliSeriesItem[];
    };
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

export async function fetchBilibiliUploaderName(mid: string): Promise<string> {
  if (!mid) return "";
  try {
    const url = `${BASE}/bilibili/x/web-interface/card?mid=${encodeURIComponent(mid)}`;
    const res = await request<{ data?: { card?: { name?: string } } }>(url, optionalBearer());
    return res.data?.card?.name || "";
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
      return { kind: "season", mid: parts[2] ?? "", id: parts[3] ?? parts[2] };
    }
    if (trimmed.startsWith("bilibili:series:")) {
      const parts = trimmed.split(":");
      return { kind: "series", mid: parts[2] ?? "", id: parts[3] ?? parts[2] };
    }

    const parsed = new URL(trimmed);
    const business = parsed.searchParams.get("business");
    const businessId = parsed.searchParams.get("business_id");
    const midFromPath = parsed.pathname.split("/").filter(Boolean).pop() ?? "";
    const midFromParam = parsed.searchParams.get("mid");
    const mid = midFromParam || (/^\d+$/.test(midFromPath) ? midFromPath : "");

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

export async function fetchBilibiliChannelCollections(
  mid: string,
  nextpage?: string,
): Promise<ChannelPlaylistsResponse> {
  const pageNum = nextpage ? Number(nextpage) || 1 : 1;
  const pageSize = 20;
  const url = `${BASE}/bilibili/x/polymer/web-space/seasons_series_list?mid=${encodeURIComponent(mid)}&page_num=${pageNum}&page_size=${pageSize}`;

  const [res, uploaderName] = await Promise.all([
    request<BilibiliSeasonsSeriesListResponse>(url, optionalBearer()),
    fetchBilibiliUploaderName(mid),
  ]);
  const lists = res.data?.items_lists;
  if (!lists) {
    return { playlists: [], nextpage: null };
  }

  const playlists: PublicPlaylistInfo[] = [];

  for (const season of lists.seasons_list ?? []) {
    const meta = season.meta;
    const seasonId = meta.season_id ?? 0;
    const title = meta.name || meta.title || "";
    const rawCover = meta.cover || season.archives?.[0]?.pic || "";
    const cover = rawCover ? proxyImage(rawCover) : "";
    const total = meta.total ?? season.archives.length;
    playlists.push({
      id: `bilibili:season:${meta.mid}:${seasonId}`,
      url: `https://www.bilibili.com/medialist/play/${meta.mid}?business=space_collection&business_id=${seasonId}`,
      title,
      thumbnailUrl: cover,
      uploaderName,
      streamCount: total,
      playlistType: "collection",
    });
  }

  for (const series of lists.series_list ?? []) {
    const meta = series.meta;
    const seriesId = meta.series_id ?? 0;
    const title = meta.name || meta.title || "";
    const rawCover = meta.cover || series.archives?.[0]?.pic || "";
    const cover = rawCover ? proxyImage(rawCover) : "";
    const total = meta.total ?? series.archives.length;
    playlists.push({
      id: `bilibili:series:${meta.mid}:${seriesId}`,
      url: `https://www.bilibili.com/medialist/play/${meta.mid}?business=space_series&business_id=${seriesId}`,
      title,
      thumbnailUrl: cover,
      uploaderName,
      streamCount: total,
      playlistType: "series",
    });
  }

  const page = lists.page;
  const hasMore = page ? page.page_num * page.page_size < page.total : false;
  const nextPageParam = hasMore ? String(pageNum + 1) : null;

  return { playlists, nextpage: nextPageParam };
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
      request<BilibiliSeasonArchivesResponse>(url, optionalBearer()),
      fetchBilibiliUploaderName(parsed.mid),
    ]);
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

  const url = `${BASE}/bilibili/x/series/archives?mid=${encodeURIComponent(parsed.mid)}&series_id=${encodeURIComponent(parsed.id)}&only_normal=true&sort=desc&pn=${pageNum}&ps=${pageSize}`;
  const [res, uploaderName] = await Promise.all([
    request<BilibiliSeriesArchivesResponse>(url, optionalBearer()),
    fetchBilibiliUploaderName(parsed.mid),
  ]);
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
    request<BilibiliRecArchivesResponse>(url, optionalBearer()),
    fetchBilibiliUploaderName(mid),
  ]);
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
