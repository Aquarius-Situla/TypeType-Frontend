import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { formatCommentPublishedTime } from "../lib/comment-time";
import { formatLikes } from "../lib/format";
import { m } from "../paraglide/messages.js";
import type { Comment } from "../types/comment";
import { RichText } from "./rich-text";

type Props = {
  reply: Comment;
  videoUrl: string;
  locale?: string;
  onSeekTimestamp?: (seconds: number) => void;
};

export function WatchReply({ reply, videoUrl, locale, onSeekTimestamp }: Props) {
  const { locale: interfaceLocale } = useInterfaceLocale();
  const publishedTime = formatCommentPublishedTime(reply.publishedAt, reply.publishedTime, locale);

  return (
    <div className="flex gap-3">
      <img
        src={reply.authorAvatarUrl || undefined}
        alt={reply.author}
        className="w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
        loading="lazy"
        decoding="async"
      />
      <div className="flex flex-col gap-1 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-fg-muted">{reply.author}</span>
          {publishedTime && <span className="text-xs text-fg-soft">{publishedTime}</span>}
        </div>
        <p className="text-sm text-fg leading-relaxed whitespace-pre-wrap">
          <RichText text={reply.text} videoUrl={videoUrl} onSeekTimestamp={onSeekTimestamp} />
        </p>
        {reply.likeCount >= 0 && (
          <span className="text-xs text-fg-soft">
            {formatLikes(reply.likeCount)} {m.watch_likes({}, { locale: interfaceLocale })}
          </span>
        )}
      </div>
    </div>
  );
}
