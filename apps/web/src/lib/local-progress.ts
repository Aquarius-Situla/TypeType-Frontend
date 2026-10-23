import type { ProgressItem } from "../types/user";

const STORAGE_PREFIX = "typetype:progress:";
const MAX_LOCAL_ENTRIES = 500;

export function progressCacheScope(userId?: string | null): string {
  const normalized = userId?.trim();
  return normalized ? `user:${encodeURIComponent(normalized)}` : "anonymous";
}

function storageKey(videoUrl: string, userId?: string | null): string {
  return `${STORAGE_PREFIX}${progressCacheScope(userId)}:${videoUrl}`;
}

export function pruneLocalProgress(maxEntries = MAX_LOCAL_ENTRIES): void {
  if (typeof window === "undefined") return;
  try {
    const items: { key: string; updatedAt: number }[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        try {
          const val = JSON.parse(localStorage.getItem(key) ?? "");
          items.push({ key, updatedAt: typeof val?.updatedAt === "number" ? val.updatedAt : 0 });
        } catch {
          items.push({ key, updatedAt: 0 });
        }
      }
    }
    if (items.length > maxEntries) {
      // Sort oldest first
      items.sort((a, b) => a.updatedAt - b.updatedAt);
      const toRemove = items.slice(0, items.length - maxEntries);
      for (const item of toRemove) {
        localStorage.removeItem(item.key);
      }
    }
  } catch {
    // ignore storage access errors
  }
}

export function getLocalProgress(videoUrl: string, userId?: string | null): ProgressItem | null {
  if (typeof window === "undefined" || !videoUrl) return null;
  try {
    const raw = localStorage.getItem(storageKey(videoUrl, userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.position === "number") {
      return {
        videoUrl,
        position: parsed.position,
        updatedAt: parsed.updatedAt ?? 0,
      };
    }
  } catch {
    // ignore corrupted localStorage
  }
  return null;
}

export function saveLocalProgress(
  videoUrl: string,
  position: number,
  updatedAt = Date.now(),
  userId?: string | null,
): void {
  if (typeof window === "undefined" || !videoUrl) return;
  const key = storageKey(videoUrl, userId);
  const serialized = JSON.stringify({
    position: Math.round(position),
    updatedAt,
  });

  try {
    localStorage.setItem(key, serialized);
  } catch {
    // Quota exceeded or storage restricted: prune older entries and retry once
    try {
      pruneLocalProgress(Math.floor(MAX_LOCAL_ENTRIES / 2));
      localStorage.setItem(key, serialized);
    } catch {
      // storage unavailable
    }
  }
}

export function getBatchLocalProgress(
  videoUrls: string[],
  userId?: string | null,
): Map<string, ProgressItem> {
  const map = new Map<string, ProgressItem>();
  for (const url of videoUrls) {
    const item = getLocalProgress(url, userId);
    if (item) map.set(url, item);
  }
  return map;
}
