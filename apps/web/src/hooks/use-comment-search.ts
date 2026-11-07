import { useInfiniteQuery } from "@tanstack/react-query";
import { searchComments } from "../lib/api-comments";
import { mapCommentItem } from "../lib/mappers";
import type { Comment } from "../types/comment";

type CommentSearchPage = {
  comments: Comment[];
  nextpage: string | null;
  scannedPages: number;
};

export function useCommentSearch(videoUrl: string, query: string) {
  return useInfiniteQuery({
    queryKey: ["comment-search", videoUrl, query],
    queryFn: async ({ pageParam }: { pageParam: string | undefined }) => {
      const res = await searchComments(videoUrl, query, pageParam);
      return {
        comments: res.comments.map(mapCommentItem),
        nextpage: res.nextpage,
        scannedPages: res.scannedPages,
      } satisfies CommentSearchPage;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: CommentSearchPage) => last.nextpage ?? undefined,
    enabled: videoUrl.length > 0 && query.length > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: false,
  });
}
