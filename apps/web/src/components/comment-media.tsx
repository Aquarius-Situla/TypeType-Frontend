import { Link } from "@tanstack/react-router";
import { Mic, Play } from "lucide-react";
import { formatDuration } from "../lib/format";
import { watchRouteSearch } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import type { Locale } from "../paraglide/runtime.js";
import type { CommentImage, CommentVoiceReply } from "../types/api";

type Props = {
  image: CommentImage | null;
  voiceReply: CommentVoiceReply | null;
  locale: Locale;
};

export function CommentMedia({ image, voiceReply, locale }: Props) {
  if (!image && !voiceReply) return null;
  return (
    <div className="flex flex-col gap-2">
      {image?.url && (
        <img
          src={image.url}
          alt={
            image.animated ? m.ui_comment_gif({}, { locale }) : m.ui_comment_image({}, { locale })
          }
          className="max-h-60 w-fit max-w-full rounded-lg bg-surface-soft object-contain"
          loading="lazy"
          decoding="async"
        />
      )}
      {image && !image.url && image.unavailableText && (
        <p className="text-sm text-fg-soft italic">{image.unavailableText}</p>
      )}
      {voiceReply && <VoiceReply reply={voiceReply} locale={locale} />}
    </div>
  );
}

function VoiceReply({ reply, locale }: { reply: CommentVoiceReply; locale: Locale }) {
  const duration = reply.durationMs > 0 ? formatDuration(Math.round(reply.durationMs / 1000)) : "";
  const label = m.ui_voice_reply({}, { locale });
  return (
    <div className="flex w-fit max-w-full flex-col gap-1.5 rounded-lg bg-surface-strong/60 px-3 py-2">
      <div className="flex items-center gap-2 text-sm text-fg-muted">
        <Mic className="size-4 shrink-0" aria-hidden="true" />
        <span className="font-medium">{label}</span>
        {duration && <span className="text-fg-soft">{duration}</span>}
        {reply.playable && (
          <Link
            to="/watch"
            search={watchRouteSearch(reply.url)}
            target="_blank"
            rel="noopener"
            className="ml-1 inline-flex items-center gap-1 rounded-md bg-fg px-2 py-0.5 text-xs font-medium text-app transition-colors hover:bg-fg-strong"
            aria-label={m.ui_play_voice_reply({}, { locale })}
          >
            <Play className="size-3" aria-hidden="true" />
            {m.ui_listen({}, { locale })}
          </Link>
        )}
      </div>
      {reply.transcript && <p className="text-sm text-fg-soft italic">{reply.transcript}</p>}
      {!reply.playable && reply.unavailableText && (
        <p className="text-xs text-fg-soft">{reply.unavailableText}</p>
      )}
    </div>
  );
}
