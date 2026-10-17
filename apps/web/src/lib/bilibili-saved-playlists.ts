import type { SavedPlaylistItem } from "../types/playlist";
import {
  isBilibiliCollectionUrl,
  parseBilibiliCollectionParams,
} from "./api-bilibili-channel-collections";

const STORAGE_KEY = "typetype:saved_bilibili_playlists";

function safeLocalStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
  if (typeof localStorage !== "undefined") return localStorage;
  return null;
}

export function getBilibiliSavedPlaylists(): SavedPlaylistItem[] {
  const storage = safeLocalStorage();
  if (!storage) return [];
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed as SavedPlaylistItem[];
    }
    return [];
  } catch {
    return [];
  }
}

export function isBilibiliSavedPlaylist(idOrUrl: string): boolean {
  if (!idOrUrl) return false;
  if (idOrUrl.startsWith("bilibili:") || isBilibiliCollectionUrl(idOrUrl)) return true;
  const current = getBilibiliSavedPlaylists();
  return current.some(
    (item) => item.id === idOrUrl || item.url === idOrUrl || item.publicPlaylistId === idOrUrl,
  );
}

export function saveBilibiliPlaylistLocally(playlist: SavedPlaylistItem): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    const current = getBilibiliSavedPlaylists();
    // Remove if already exists (same id or same bilibili params)
    const targetParams = parseBilibiliCollectionParams(playlist.url);
    const filtered = current.filter((item) => {
      if (
        item.id === playlist.id ||
        item.url === playlist.url ||
        item.publicPlaylistId === playlist.publicPlaylistId
      ) {
        return false;
      }
      if (targetParams) {
        const itemParams = parseBilibiliCollectionParams(item.url);
        if (
          itemParams &&
          itemParams.kind === targetParams.kind &&
          itemParams.mid === targetParams.mid &&
          itemParams.id === targetParams.id
        ) {
          return false;
        }
      }
      return true;
    });

    filtered.unshift(playlist);
    storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // ignore
  }
}

export function removeBilibiliPlaylistLocally(idOrUrl: string): boolean {
  const storage = safeLocalStorage();
  if (!storage) return false;
  try {
    const current = getBilibiliSavedPlaylists();
    const targetParams = parseBilibiliCollectionParams(idOrUrl);
    const initialLen = current.length;

    const filtered = current.filter((item) => {
      if (item.id === idOrUrl || item.url === idOrUrl || item.publicPlaylistId === idOrUrl) {
        return false;
      }
      if (targetParams) {
        const itemParams = parseBilibiliCollectionParams(item.url);
        if (
          itemParams &&
          itemParams.kind === targetParams.kind &&
          itemParams.mid === targetParams.mid &&
          itemParams.id === targetParams.id
        ) {
          return false;
        }
      }
      return true;
    });

    if (filtered.length !== initialLen) {
      storage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
