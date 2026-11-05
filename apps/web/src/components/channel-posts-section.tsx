import { useChannelPosts } from "../hooks/use-channel-posts";
import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { m } from "../paraglide/messages.js";
import { CommunityPostCard } from "./community-post-card";
import { PageSpinner } from "./page-spinner";
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

  if (isLoading) return <PageSpinner />;
  if (isError && posts.length === 0) {
    return <p className="text-sm text-fg-muted">{m.ui_unable_to_load_posts()}</p>;
  }
  if (posts.length === 0) {
    return <p className="text-sm text-fg-muted">{m.ui_no_posts_on_this_channel()}</p>;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      {posts.map((post) => (
        <CommunityPostCard key={post.id} post={post} locale={locale} />
      ))}
      {isFetchingNextPage && <PageSpinner />}
      <ScrollSentinel onIntersect={fetchNextPage} enabled={hasNextPage && !isFetchingNextPage} />
    </div>
  );
}
