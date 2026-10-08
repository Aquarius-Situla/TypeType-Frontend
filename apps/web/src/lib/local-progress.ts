import type { ProgressItem } from "../types/user";

const STORAGE_KEY = "typed-progress-cache";
const MAX_CACHE_ENTRIES = 500;

type CacheMap = Record<string, ProgressItem>;

function readCache(): CacheMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CacheMap;
  } catch {
    return {};
  }
}

function writeCache(cache: CacheMap): void {
  try {
    const entries = Object.entries(cache);
    if (entries.length > MAX_CACHE_ENTRIES) {
      entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt);
      const pruned = Object.fromEntries(entries.slice(0, MAX_CACHE_ENTRIES));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pruned));
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // LocalStorage quota exceeded or private mode
  }
}

export function getLocalProgress(videoUrl: string): ProgressItem | null {
  if (!videoUrl) return null;
  const cache = readCache();
  return cache[videoUrl] ?? null;
}

export function saveLocalProgress(
  videoUrl: string,
  position: number,
  updatedAt = Date.now(),
): ProgressItem {
  const cache = readCache();
  const item: ProgressItem = {
    videoUrl,
    position: Math.max(0, Math.round(position)),
    updatedAt,
  };
  cache[videoUrl] = item;
  writeCache(cache);
  return item;
}

export function getBatchLocalProgress(videoUrls: string[]): Map<string, ProgressItem> {
  const cache = readCache();
  const map = new Map<string, ProgressItem>();
  for (const url of videoUrls) {
    if (cache[url]) map.set(url, cache[url]);
  }
  return map;
}
