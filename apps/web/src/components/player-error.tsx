import { useRouter } from "@tanstack/react-router";
import { m } from "../paraglide/messages.js";

type Props = {
  onRetry: () => void;
};

export function PlayerError({ onRetry }: Props) {
  const router = useRouter();

  return (
    <div
      role="alert"
      className="flex aspect-video w-full min-h-0 flex-col items-center justify-start gap-3 overflow-y-auto sm:justify-center bg-app px-4 py-3"
    >
      <img
        src="/sad-sigh.gif"
        width="80"
        height="80"
        alt=""
        className="size-12 shrink-0 rounded-lg sm:size-20"
      />
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-white text-base font-semibold tracking-tight">
          {m.ui_playback_failed()}
        </p>
        <p className="text-fg-muted text-sm max-w-xs text-center">
          {m.ui_this_video_could_not_be_played_the_stream_may_be_unavailable_or_unsup()}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="cursor-pointer rounded-md bg-fg px-5 py-2 text-sm font-medium text-app transition-opacity hover:opacity-85"
        >
          {m.ui_retry()}
        </button>
        <button
          type="button"
          onClick={() => router.history.back()}
          className="cursor-pointer rounded-md bg-surface-strong px-5 py-2 text-sm font-medium text-fg transition-colors hover:bg-surface-soft"
        >
          {m.not_found_back()}
        </button>
      </div>
    </div>
  );
}
