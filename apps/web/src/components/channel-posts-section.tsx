import { useChannelPosts } from "../hooks/use-channel-posts";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";
import { CommunityPostCard } from "./community-post-card";
import { ScrollSentinel } from "./scroll-sentinel";

type Props = {
  channelUrl: string;
};

export function ChannelPostsSection({ channelUrl }: Props) {
  const { locale } = useInterfaceLocale();
  const { data, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useChannelPosts(channelUrl);
  const posts = (data?.pages.flatMap((page) => page.posts) ?? []).filter(
    (post, index, all) => all.findIndex((other) => other.id === post.id) === index,
  );

  if (isLoading) return <PostsSkeleton />;
  if (isError && posts.length === 0) {
    return (
      <p className="mx-auto w-full max-w-2xl text-sm text-fg-muted">
        {m.ui_unable_to_load_posts()}
      </p>
    );
  }
  if (posts.length === 0) {
    return (
      <p className="mx-auto w-full max-w-2xl text-sm text-fg-muted">
        {m.ui_no_posts_on_this_channel()}
      </p>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4">
      {posts.map((post) => (
        <CommunityPostCard key={post.id} post={post} locale={locale} />
      ))}
      {isFetchingNextPage && <PostsSkeleton count={1} />}
      <ScrollSentinel onIntersect={fetchNextPage} enabled={hasNextPage && !isFetchingNextPage} />
    </div>
  );
}

function PostsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4" aria-hidden="true">
      {Array.from({ length: count }, (_, index) => `post-skeleton-${index}`).map((key) => (
        <div
          key={key}
          className="flex animate-pulse flex-col gap-3 rounded-2xl border border-border p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-surface-strong" />
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-28 rounded bg-surface-strong" />
              <div className="h-2.5 w-16 rounded bg-surface-strong" />
            </div>
          </div>
          <div className="h-3 w-full rounded bg-surface-strong" />
          <div className="h-3 w-4/5 rounded bg-surface-strong" />
          <div className="aspect-video w-full rounded-xl bg-surface-strong" />
        </div>
      ))}
    </div>
  );
}
