import { Loader2, Mic, Pause, Play } from "lucide-react";
import { useVoiceReplyPlayer } from "../hooks/use-voice-reply-player";
import { formatDuration } from "../lib/format";
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
  return (
    <div className="flex w-full max-w-sm flex-col gap-2 rounded-xl bg-surface-strong/60 px-3 py-2.5">
      <div className="flex items-center gap-3">
        {reply.playable ? (
          <VoiceReplyPlayer url={reply.url} duration={duration} locale={locale} />
        ) : (
          <div className="flex items-center gap-2 text-sm text-fg-muted">
            <Mic className="size-4 shrink-0" aria-hidden="true" />
            <span className="font-medium">{m.ui_voice_reply({}, { locale })}</span>
            {duration && <span className="text-fg-soft tabular-nums">{duration}</span>}
          </div>
        )}
      </div>
      {reply.transcript && <p className="text-sm text-fg-soft italic">{reply.transcript}</p>}
      {!reply.playable && reply.unavailableText && (
        <p className="text-xs text-fg-soft">{reply.unavailableText}</p>
      )}
    </div>
  );
}

function VoiceReplyPlayer({
  url,
  duration,
  locale,
}: {
  url: string;
  duration: string;
  locale: Locale;
}) {
  const { state, progress, toggle } = useVoiceReplyPlayer(url);
  const playing = state === "playing";
  return (
    <>
      <button
        type="button"
        onClick={() => void toggle()}
        disabled={state === "loading"}
        aria-label={
          playing ? m.ui_pause_voice_reply({}, { locale }) : m.ui_play_voice_reply({}, { locale })
        }
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fg text-app transition-transform hover:scale-105 disabled:cursor-wait"
      >
        {state === "loading" ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : playing ? (
          <Pause className="size-4 fill-current" aria-hidden="true" />
        ) : (
          <Play className="ml-0.5 size-4 fill-current" aria-hidden="true" />
        )}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-1.5 text-xs text-fg-muted">
          <Mic className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="font-medium">{m.ui_voice_reply({}, { locale })}</span>
          {duration && <span className="ml-auto text-fg-soft tabular-nums">{duration}</span>}
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-fg/15">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-200 ease-linear"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
        {state === "error" && (
          <span role="alert" className="text-xs text-fg-soft">
            {m.ui_voice_reply_unavailable({}, { locale })}
          </span>
        )}
      </div>
    </>
  );
}
