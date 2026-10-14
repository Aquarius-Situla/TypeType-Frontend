import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchBilibiliCollectionEpisodes,
  isBilibiliCollectionUrl,
  parseBilibiliCollectionParams,
} from "../lib/api-bilibili-channel-collections";
import {
  deleteSavedPlaylist,
  fetchSavedPlaylists,
  savePublicPlaylist,
} from "../lib/api-saved-playlists";
import {
  getBilibiliSavedPlaylists,
  isBilibiliSavedPlaylist,
  removeBilibiliPlaylistLocally,
  saveBilibiliPlaylistLocally,
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
  if (isBilibiliCollectionUrl(url) || isBilibiliCollectionUrl(item.url)) {
    const p1 = parseBilibiliCollectionParams(url);
    const p2 = parseBilibiliCollectionParams(item.url);
    if (p1 && p2 && p1.kind === p2.kind && p1.mid === p2.mid && p1.id === p2.id) {
      return true;
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
      const seen = new Set<string>();
      const merged: SavedPlaylistItem[] = [];
      for (const item of [...remote, ...local]) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
      return merged;
    },
    enabled: true,
  });

  const save = useMutation({
    mutationFn: async (input: SavePlaylistInput) => {
      const url = typeof input === "string" ? input : input.url;
      const info = typeof input === "string" ? undefined : input.info;

      if (isBilibiliCollectionUrl(url)) {
        let title = info?.title;
        let cover = info?.thumbnailUrl;
        let uploader = info?.uploaderName ?? "";
        let streamCount = info?.streamCount ?? 0;
        let playlistType = info?.playlistType ?? "collection";
        let collectionId = info?.id;

        if (!title || !collectionId) {
          const res = await fetchBilibiliCollectionEpisodes(url);
          title = res.playlist.title;
          cover = res.playlist.thumbnailUrl;
          uploader = res.playlist.uploaderName;
          streamCount = res.playlist.streamCount;
          playlistType = res.playlist.playlistType;
          collectionId = res.playlist.id;
        }

        const item: SavedPlaylistItem = {
          id: collectionId || `bilibili:${url}`,
          publicPlaylistId: collectionId || url,
          url,
          title: title || "合集",
          thumbnailUrl: cover || "",
          uploaderName: uploader,
          streamCount,
          playlistType,
          savedAt: Date.now(),
        };

        saveBilibiliPlaylistLocally(item);
        return item;
      }

      return savePublicPlaylist(url);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: async (idOrUrl: string) => {
      if (isBilibiliSavedPlaylist(idOrUrl)) {
        removeBilibiliPlaylistLocally(idOrUrl);
        return;
      }
      return deleteSavedPlaylist(idOrUrl);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const items = query.data ?? [];

  return {
    query,
    items,
    save,
    remove,
    findSaved: (url: string) => items.find((item) => samePlaylist(item, url)),
  };
}
