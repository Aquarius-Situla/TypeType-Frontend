import { MessageSquare, ThumbsUp } from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { formatCommentPublishedTime } from "../lib/comment-time";
import { formatLikes } from "../lib/format";
import { proxyImage } from "../lib/proxy";
import { m } from "../paraglide/messages.js";
import type { Locale } from "../paraglide/runtime.js";
import type { CommunityPost } from "../types/community-post";
import { PostImages, PostPoll, PostVideo } from "./community-post-media";
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
  const avatarSize = nested ? "size-7" : "size-10";
  return (
    <article
      className={
        nested
          ? "flex flex-col gap-3 rounded-xl bg-surface-strong/50 p-3"
          : "flex flex-col gap-3 rounded-2xl border border-border p-4 sm:p-5"
      }
    >
      <header className="flex items-center gap-3">
        {post.authorAvatarUrl ? (
          <img
            src={proxyImage(post.authorAvatarUrl)}
            alt=""
            className={`${avatarSize} shrink-0 rounded-full bg-surface-strong`}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className={`${avatarSize} shrink-0 rounded-full bg-surface-strong`} />
        )}
        <div className="flex min-w-0 flex-col">
          <span className="truncate text-sm font-semibold text-fg">{post.authorName}</span>
          {publishedTime && <span className="text-xs text-fg-soft">{publishedTime}</span>}
        </div>
      </header>
      {post.text && <PostText text={post.text} locale={locale} />}
      <PostImages images={post.images} />
      {post.poll && <PostPoll poll={post.poll} />}
      {post.video && <PostVideo video={post.video} />}
      {post.sharedPost && <CommunityPostCard post={post.sharedPost} locale={locale} nested />}
      {!nested && (likes || comments) && (
        <footer className="flex items-center gap-2">
          {likes && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-strong/70 px-3 text-xs font-medium text-fg-muted">
              <ThumbsUp className="size-3.5" aria-hidden="true" />
              {likes}
              <span className="sr-only">{m.watch_likes({}, { locale })}</span>
            </span>
          )}
          {comments && (
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full bg-surface-strong/70 px-3 text-xs font-medium text-fg-muted">
              <MessageSquare className="size-3.5" aria-hidden="true" />
              {comments}
              <span className="sr-only">{m.watch_comments({}, { locale })}</span>
            </span>
          )}
        </footer>
      )}
    </article>
  );
}

const FOLD_AFTER_CHARACTERS = 500;

function PostText({ text, locale }: { text: string; locale: Locale }) {
  const foldable = text.replace(/<[^>]*>/g, "").length > FOLD_AFTER_CHARACTERS;
  const [expanded, setExpanded] = useState(false);
  const [overflows, setOverflows] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (el) setOverflows(el.scrollHeight > el.clientHeight + 1);
  }, []);

  return (
    <div className="flex flex-col items-start gap-1">
      <div
        ref={ref}
        className={`break-words text-[15px] leading-6 text-fg [&_a]:no-underline [&_a:hover]:underline ${foldable && !expanded ? "line-clamp-[10]" : ""}`}
      >
        <RichText text={text} />
      </div>
      {(overflows || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="text-sm font-medium text-fg-muted hover:text-fg"
        >
          {expanded ? m.watch_show_less({}, { locale }) : m.watch_show_more({}, { locale })}
        </button>
      )}
    </div>
  );
}
