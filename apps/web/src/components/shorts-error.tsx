import { Link } from "@tanstack/react-router";
import { m } from "../paraglide/messages.js";
import { ReactionGif } from "./reaction-gif";
import { YoutubeIcon } from "./youtube-icon";

type Props = {
  message: string;
  onRetry: () => void;
  onNext: () => void;
  youtubeSessionAction?: "connect" | "reconnect";
  youtubeSessionReturnTo?: string;
};

export function ShortsError({
  message,
  onRetry,
  onNext,
  youtubeSessionAction,
  youtubeSessionReturnTo,
}: Props) {
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/80 p-5">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        {youtubeSessionAction === "reconnect" && youtubeSessionReturnTo ? (
          <Link
            to="/youtube-session"
            search={{ returnTo: youtubeSessionReturnTo }}
            aria-label={m.ui_reconnect_with_youtube()}
            className="cursor-pointer"
          >
            <ReactionGif kind="youtubeReconnect" size={112} className="size-28" />
          </Link>
        ) : null}
        <p className="text-sm text-fg">{message}</p>
        <div className="flex items-center gap-2">
          {youtubeSessionReturnTo ? (
            <Link
              to="/youtube-session"
              search={{ returnTo: youtubeSessionReturnTo }}
              className="inline-flex h-9 items-center gap-2 rounded-md bg-fg px-3 text-xs font-medium text-app hover:bg-white"
            >
              <YoutubeIcon className="h-4 w-4 text-[#ff0000]" />
              {youtubeSessionAction === "reconnect"
                ? m.ui_reconnect_with_youtube()
                : m.ui_connect_with_youtube()}
            </Link>
          ) : (
            <button
              type="button"
              onClick={onRetry}
              className="h-9 rounded-md bg-fg px-3 text-xs font-medium text-app hover:bg-white"
            >
              {m.ui_retry()}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className="h-9 rounded-md border border-border-strong px-3 text-xs text-fg hover:border-border-strong"
          >
            {m.ui_next()}
          </button>
        </div>
      </div>
    </div>
  );
}
