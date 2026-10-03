import { useQuery } from "@tanstack/react-query";
import { fetchPlaylist } from "../lib/api-playlists";
import type { PlaylistVideoItem } from "../types/user";

const KEY = ["playlists"];

function needsMetadata(video: PlaylistVideoItem): boolean {
  return (
    video.title.startsWith("YouTube video ") ||
    video.thumbnail === "" ||
    video.duration <= 0 ||
    video.channelName === "" ||
    video.channelUrl === "" ||
    video.channelAvatar === ""
  );
}

export function usePlaylist(id: string) {
  return useQuery({
    queryKey: [...KEY, id],
    queryFn: () => fetchPlaylist(id),
    enabled: id.length > 0,
    refetchInterval: (query) =>
      query.state.dataUpdateCount < 12 && (query.state.data?.videos ?? []).some(needsMetadata)
        ? 4_000
        : false,
  });
}
