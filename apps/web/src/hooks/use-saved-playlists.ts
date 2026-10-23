import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  isBilibiliCollectionUrl,
  parseBilibiliCollectionParams,
  toCanonicalBilibiliCollectionUrl,
} from "../lib/api-bilibili-channel-collections";
import {
  deleteSavedPlaylist,
  fetchSavedPlaylists,
  savePublicPlaylist,
} from "../lib/api-saved-playlists";
import {
  getBilibiliSavedPlaylists,
  removeBilibiliPlaylistLocally,
} from "../lib/bilibili-saved-playlists";
import { playlistListId } from "../lib/playlist-url";
import type { PublicPlaylistInfo, SavedPlaylistItem } from "../types/playlist";
import { useAuth } from "./use-auth";

const KEY = ["saved-playlists"];

export type SavePlaylistInput = string | { url: string; info?: Partial<PublicPlaylistInfo> };

function samePlaylist(item: SavedPlaylistItem, url: string): boolean {
  if (item.url === url || item.id === url || item.publicPlaylistId === url) return true;
  const listId = playlistListId(url);
  if (listId && (item.publicPlaylistId === listId || playlistListId(item.url) === listId)) {
    return true;
  }
  if (
    isBilibiliCollectionUrl(url) ||
    isBilibiliCollectionUrl(item.url) ||
    isBilibiliCollectionUrl(item.id) ||
    (item.publicPlaylistId && isBilibiliCollectionUrl(item.publicPlaylistId))
  ) {
    const p1 = parseBilibiliCollectionParams(url);
    const p2 =
      parseBilibiliCollectionParams(item.url) ||
      parseBilibiliCollectionParams(item.id) ||
      (item.publicPlaylistId ? parseBilibiliCollectionParams(item.publicPlaylistId) : null);
    if (p1 && p2 && p1.kind === p2.kind && p1.id === p2.id) {
      if (!p1.mid || !p2.mid || p1.mid === p2.mid) {
        return true;
      }
    }
  }
  return false;
}

export function useSavedPlaylists() {
  const qc = useQueryClient();
  const { authReady, isAuthed } = useAuth();
  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const remote = authReady && isAuthed ? await fetchSavedPlaylists().catch(() => []) : [];
      const local = getBilibiliSavedPlaylists();

      // If user is authenticated and has local Bilibili playlists, attempt background sync to remote
      if (authReady && isAuthed && local.length > 0) {
        for (const item of local) {
          const canonicalUrl = toCanonicalBilibiliCollectionUrl(item.url);
          try {
            const savedRemote = await savePublicPlaylist(canonicalUrl);
            removeBilibiliPlaylistLocally(item.url);
            removeBilibiliPlaylistLocally(item.id);
            if (!remote.some((r) => samePlaylist(r, item.url))) {
              remote.unshift(savedRemote);
            }
          } catch {
            // Keep local copy as fallback if server save fails
          }
        }
      }

      const currentLocal = getBilibiliSavedPlaylists();
      const merged: SavedPlaylistItem[] = [];
      for (const item of [...remote, ...currentLocal]) {
        if (
          !merged.some(
            (m) => m.id === item.id || samePlaylist(m, item.url) || samePlaylist(m, item.id),
          )
        ) {
          merged.push(item);
        }
      }
      return merged;
    },
    enabled: true,
  });

  const items = query.data ?? [];

  const save = useMutation({
    mutationFn: async (input: SavePlaylistInput) => {
      const url = typeof input === "string" ? input : input.url;
      const targetUrl = isBilibiliCollectionUrl(url) ? toCanonicalBilibiliCollectionUrl(url) : url;
      const remoteItem = await savePublicPlaylist(targetUrl);
      removeBilibiliPlaylistLocally(url);
      removeBilibiliPlaylistLocally(targetUrl);
      return remoteItem;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: async (idOrUrl: string) => {
      const existing = items.find((item) => samePlaylist(item, idOrUrl));
      removeBilibiliPlaylistLocally(idOrUrl);
      if (existing) {
        removeBilibiliPlaylistLocally(existing.id);
        removeBilibiliPlaylistLocally(existing.url);
      }
      if (authReady && isAuthed) {
        const idToDelete = existing?.id || idOrUrl;
        await deleteSavedPlaylist(idToDelete).catch(() => {});
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return {
    query,
    items,
    save,
    remove,
    findSaved: (url: string) => items.find((item) => samePlaylist(item, url)),
  };
}
