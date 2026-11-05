import { Link } from "@tanstack/react-router";
import { MessageSquare, ThumbsUp } from "lucide-react";
import { formatCommentPublishedTime } from "../lib/comment-time";
import { formatLikes } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { watchRouteSearch } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import type { Locale } from "../paraglide/runtime.js";
import type { CommunityPost, CommunityPostPoll, CommunityPostVideo } from "../types/community-post";
import { RichText } from "./rich-text";

type Props = {
  post: CommunityPost;
  locale: Locale;
  nested?: boolean;
};

export function CommunityPostCard({ post, locale, nested = false }: Props) {
  const publishedTime = formatCommentPublishedTime(post.publishedAt, post.publishedTime, locale);
  const likes = post.textualLikeCount.trim() || (post.likeCount ? formatLikes(post.likeCount) : "");
  const comments = post.textualCommentCount.trim();
  return (
    <article
      className={`flex gap-3 rounded-xl ${nested ? "border border-border-strong p-3" : "bg-surface-soft/60 p-4"}`}
    >
      {post.authorAvatarUrl ? (
        <img
          src={proxyImage(post.authorAvatarUrl)}
          alt=""
          className="size-9 shrink-0 rounded-full bg-surface-soft"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div className="size-9 shrink-0 rounded-full bg-surface-soft" />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-fg-muted">{post.authorName}</span>
          {publishedTime && <span className="text-sm text-fg-soft">{publishedTime}</span>}
        </div>
        {post.text && (
          <p className="whitespace-pre-wrap text-base leading-relaxed text-fg">
            <RichText text={post.text} />
          </p>
        )}
        <PostImages images={post.images} />
        {post.poll && <PostPoll poll={post.poll} locale={locale} />}
        {post.video && <PostVideo video={post.video} />}
        {post.sharedPost && <CommunityPostCard post={post.sharedPost} locale={locale} nested />}
        {!nested && (likes || comments) && (
          <div className="flex items-center gap-4 text-sm text-fg-soft">
            {likes && (
              <span className="inline-flex items-center gap-1.5">
                <ThumbsUp className="size-4" aria-hidden="true" />
                {likes}
                <span className="sr-only">{m.watch_likes({}, { locale })}</span>
              </span>
            )}
            {comments && (
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="size-4" aria-hidden="true" />
                {comments}
                <span className="sr-only">{m.watch_comments({}, { locale })}</span>
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

function PostImages({ images }: { images: string[] }) {
  if (images.length === 0) return null;
  if (images.length === 1) {
    return (
      <img
        src={proxyImage(images[0])}
        alt=""
        className="max-h-[32rem] w-fit max-w-full rounded-lg bg-surface-soft object-contain"
        loading="lazy"
        decoding="async"
      />
    );
  }
  return (
    <div className="grid max-w-xl grid-cols-2 gap-2">
      {images.map((url) => (
        <img
          key={url}
          src={proxyImage(url)}
          alt=""
          className="aspect-square w-full rounded-lg bg-surface-soft object-cover"
          loading="lazy"
          decoding="async"
        />
      ))}
    </div>
  );
}

function PostPoll({ poll, locale }: { poll: CommunityPostPoll; locale: Locale }) {
  return (
    <div className="flex max-w-xl flex-col gap-2">
      {poll.choices.map((choice) => (
        <div
          key={choice.text}
          className="flex items-center gap-3 rounded-lg border border-border-strong px-3 py-2 text-sm text-fg"
        >
          {choice.imageUrl && (
            <img
              src={proxyImage(choice.imageUrl)}
              alt=""
              className="size-12 shrink-0 rounded-md bg-surface-soft object-cover"
              loading="lazy"
              decoding="async"
            />
          )}
          <span>{choice.text}</span>
        </div>
      ))}
      {poll.textualVoteCount && (
        <span className="text-sm text-fg-soft">
          {poll.textualVoteCount}
          <span className="sr-only"> {m.ui_poll({}, { locale })}</span>
        </span>
      )}
    </div>
  );
}

function PostVideo({ video }: { video: CommunityPostVideo }) {
  return (
    <Link
      to="/watch"
      search={watchRouteSearch(video.url)}
      className="group flex max-w-xl gap-3 rounded-lg border border-border-strong p-2 transition-colors hover:bg-surface-strong/60"
    >
      {video.thumbnailUrl && (
        <img
          src={proxyImage(video.thumbnailUrl)}
          alt=""
          className="aspect-video w-40 shrink-0 rounded-md bg-surface-soft object-cover"
          loading="lazy"
          decoding="async"
        />
      )}
      <span className="line-clamp-3 text-sm font-medium text-fg group-hover:text-fg-strong">
        {video.title}
      </span>
    </Link>
  );
}
