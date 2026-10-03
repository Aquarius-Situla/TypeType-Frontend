import type { PlaylistItem, PlaylistVideoItem } from "../types/user";

export function filterPlaylistSummaries(
  playlists: PlaylistItem[],
  filter: (videos: PlaylistVideoItem[]) => PlaylistVideoItem[],
): PlaylistItem[] {
  return playlists.map((playlist) => {
    const videos = playlist.videos ? filter(playlist.videos) : undefined;
    return {
      ...playlist,
      videos,
      videoCount: playlist.videoCount ?? videos?.length,
    };
  });
}
