import { useInfiniteQuery } from "@tanstack/react-query";
import { fetchChannelPosts } from "../lib/api-channel-posts";
import type { ChannelPostsResponse } from "../types/community-post";

export function useChannelPosts(channelUrl: string) {
  return useInfiniteQuery({
    queryKey: ["channel-posts", channelUrl],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      fetchChannelPosts(channelUrl, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ChannelPostsResponse) => last.nextpage ?? undefined,
    enabled: channelUrl.length > 0,
  });
}
