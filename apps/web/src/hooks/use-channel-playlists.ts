import { useInfiniteQuery } from "@tanstack/react-query";
import { type ChannelPlaylistTab, fetchChannelPlaylists } from "../lib/api-channel-playlists";
import type { PublicPlaylistInfo } from "../types/playlist";

type ChannelPlaylistsPage = {
  playlists: PublicPlaylistInfo[];
  nextpage: string | null;
};

export function useChannelPlaylists(channelUrl: string, tab: ChannelPlaylistTab = "playlists") {
  return useInfiniteQuery({
    queryKey:
      tab === "playlists"
        ? ["channel-playlists", channelUrl]
        : ["channel-playlists", channelUrl, tab],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const res = await fetchChannelPlaylists(channelUrl, pageParam, tab);
      return {
        playlists: res.playlists ?? [],
        nextpage: res.nextpage,
      } satisfies ChannelPlaylistsPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ChannelPlaylistsPage) => last.nextpage ?? undefined,
    enabled: channelUrl.length > 0,
  });
}
