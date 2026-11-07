import { useCallback, useMemo, useState } from "react";
import { useInfiniteComments } from "../hooks/use-infinite-comments";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";
import { ScrollSentinel } from "./scroll-sentinel";
import { WatchCommentSearchField } from "./watch-comment-search-field";
import { WatchCommentSearchResults } from "./watch-comment-search-results";
import { WatchCommentSkeleton } from "./watch-comment-skeleton";
import { WatchCommentsLazyList } from "./watch-comments-lazy-list";

const SKELETON_KEYS = Array.from({ length: 5 }, (_, i) => `cs-${i}`);
const INITIAL_RENDER_COUNT = 4;
const RENDER_STEP = 4;

type Props = {
  videoUrl: string;
  onSeekTimestamp?: (seconds: number) => void;
};

export function WatchComments({ videoUrl, onSeekTimestamp }: Props) {
  const { locale } = useInterfaceLocale();
  const { data, isFetchingNextPage, hasNextPage, fetchNextPage, isLoading } =
    useInfiniteComments(videoUrl);
  const [renderCount, setRenderCount] = useState(INITIAL_RENDER_COUNT);
  const [search, setSearch] = useState({ videoUrl, query: "" });
  const searchQuery = search.videoUrl === videoUrl ? search.query : "";

  const commentsDisabled = data?.pages[0]?.commentsDisabled ?? false;
  const allComments = data?.pages.flatMap((p) => p.comments) ?? [];
  const comments = allComments.filter(
    (c) => (c.text as string | null) && (c.author as string | null),
  );
  const visibleComments = useMemo(() => comments.slice(0, renderCount), [comments, renderCount]);
  const hasHiddenComments = visibleComments.length < comments.length;
  const loadMore = useCallback(() => {
    if (hasHiddenComments) {
      setRenderCount((count) => Math.min(count + RENDER_STEP, comments.length));
      return;
    }
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasHiddenComments, comments.length, hasNextPage, isFetchingNextPage, fetchNextPage]);
  const showSkeletons = isLoading || isFetchingNextPage;
  const canLoadMore = hasHiddenComments || !!hasNextPage;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-fg">{m.watch_comments({}, { locale })}</h2>
        {!commentsDisabled && (
          <WatchCommentSearchField
            key={videoUrl}
            query={searchQuery}
            onSearch={(query) => setSearch({ videoUrl, query })}
          />
        )}
      </div>
      {commentsDisabled ? (
        <p className="text-sm text-fg-soft">{m.watch_comments_disabled({}, { locale })}</p>
      ) : searchQuery ? (
        <WatchCommentSearchResults
          videoUrl={videoUrl}
          query={searchQuery}
          onSeekTimestamp={onSeekTimestamp}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <WatchCommentsLazyList
            comments={visibleComments}
            videoUrl={videoUrl}
            onSeekTimestamp={onSeekTimestamp}
          />
          {showSkeletons && SKELETON_KEYS.map((k) => <WatchCommentSkeleton key={k} />)}
          <ScrollSentinel
            onIntersect={loadMore}
            enabled={canLoadMore && !isLoading && !isFetchingNextPage}
          />
        </div>
      )}
    </div>
  );
}
