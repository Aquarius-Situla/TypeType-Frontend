import { useCommentSearch } from "../hooks/use-comment-search";
import { m } from "../paraglide/messages.js";
import { WatchCommentSkeleton } from "./watch-comment-skeleton";
import { WatchCommentsLazyList } from "./watch-comments-lazy-list";

const SKELETON_KEYS = Array.from({ length: 3 }, (_, i) => `search-${i}`);

type Props = {
  videoUrl: string;
  query: string;
  onSeekTimestamp?: (seconds: number) => void;
};

export function WatchCommentSearchResults({ videoUrl, query, onSeekTimestamp }: Props) {
  const { data, isLoading, isError, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
    useCommentSearch(videoUrl, query);
  const pages = data?.pages ?? [];
  const comments = pages.flatMap((page) => page.comments);
  const scannedPages = pages.reduce((total, page) => total + page.scannedPages, 0);
  const busy = isLoading || isFetchingNextPage;

  return (
    <div className="flex flex-col gap-6">
      {comments.length > 0 && (
        <WatchCommentsLazyList
          comments={comments}
          videoUrl={videoUrl}
          onSeekTimestamp={onSeekTimestamp}
        />
      )}
      {busy && SKELETON_KEYS.map((key) => <WatchCommentSkeleton key={key} />)}
      {isError && !busy && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-fg-soft">
          <span role="alert">{m.watch_comments_search_error()}</span>
          <button type="button" className="text-fg underline" onClick={() => void refetch()}>
            {m.watch_comments_search_retry()}
          </button>
        </div>
      )}
      {!busy && !isError && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-fg-soft" aria-live="polite">
          <span>
            {comments.length === 0
              ? m.watch_comments_search_none({ pages: scannedPages })
              : m.watch_comments_search_found({ count: comments.length, pages: scannedPages })}
          </span>
          {hasNextPage && (
            <button
              type="button"
              className="rounded-full bg-surface-soft px-3 py-1.5 text-fg hover:bg-surface-strong"
              onClick={() => void fetchNextPage()}
            >
              {m.watch_comments_search_more()}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
