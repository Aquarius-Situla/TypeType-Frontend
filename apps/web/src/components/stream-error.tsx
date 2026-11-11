import { Link, useRouter } from "@tanstack/react-router";
import { useAuth } from "../hooks/use-auth";
import { familyListBlockedMessage } from "../lib/allow-list-error";
import { parseGeoRestriction } from "../lib/geo-restriction";
import { isMemberOnlyMessage } from "../lib/member-only";
import { type VideoAvailability, videoAvailabilityCopy } from "../lib/video-availability";
import { m } from "../paraglide/messages.js";
import { FlagIcon } from "./flag-icon";
import { ReactionGif } from "./reaction-gif";
import { VideoAvailabilityPoster } from "./video-availability-poster";
import { YoutubeIcon } from "./youtube-icon";

type Props = {
  message: string;
  onRetry?: () => void;
  youtubeSessionReturnTo?: string;
  youtubeSessionAction?: "connect" | "reconnect";
  familyListBlocked?: boolean;
  availability?: VideoAvailability;
  poster?: string;
};

export function StreamError({
  message,
  onRetry,
  youtubeSessionReturnTo,
  youtubeSessionAction,
  familyListBlocked: familyListBlockedOverride,
  availability,
  poster,
}: Props) {
  const router = useRouter();
  const { canGlobalBlock } = useAuth();
  const availabilityCopy = availability ? videoAvailabilityCopy(availability, message) : null;
  const displayedMessage = availabilityCopy?.message ?? message;
  const countryCode = parseGeoRestriction(displayedMessage);
  const isMemberOnly = availability === "members_only" || isMemberOnlyMessage(displayedMessage);
  const familyListBlocked = familyListBlockedOverride ?? message === familyListBlockedMessage();
  const youtubeSessionReconnect = youtubeSessionAction === "reconnect";
  const errorImage = (
    <ReactionGif
      kind={
        youtubeSessionReconnect
          ? "youtubeReconnect"
          : familyListBlocked
            ? "familyListBlocked"
            : isMemberOnly
              ? "membersOnly"
              : "videoError"
      }
      size={220}
      className="size-[220px]"
    />
  );

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 bg-app px-4">
      {availability ? (
        <VideoAvailabilityPoster availability={availability} message={message} poster={poster} />
      ) : (
        <>
          {youtubeSessionReconnect && youtubeSessionReturnTo ? (
            <Link
              to="/youtube-session"
              search={{ returnTo: youtubeSessionReturnTo }}
              aria-label={m.ui_reconnect_with_youtube()}
              className="cursor-pointer"
            >
              {errorImage}
            </Link>
          ) : (
            errorImage
          )}
          <div className="flex flex-col items-center gap-1.5">
            <p className="text-base font-semibold tracking-tight text-white">
              {m.ui_couldn_t_load_this_video()}
            </p>
            <div className="flex items-center gap-2">
              {countryCode && (
                <FlagIcon code={countryCode} className="h-4 w-5 shrink-0 rounded-sm" />
              )}
              <p className="max-w-xs text-center text-sm text-fg-muted">{displayedMessage}</p>
            </div>
          </div>
        </>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {onRetry && !availability && (
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer rounded-md bg-white px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg"
          >
            {m.ui_retry()}
          </button>
        )}
        {youtubeSessionReturnTo && (
          <Link
            to="/youtube-session"
            search={{ returnTo: youtubeSessionReturnTo }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-white px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg"
          >
            <YoutubeIcon className="h-4 w-4 text-[#ff0000]" />
            <span>
              {youtubeSessionAction === "reconnect"
                ? m.ui_reconnect_with_youtube()
                : m.ui_connect_with_youtube()}
            </span>
          </Link>
        )}
        {familyListBlocked && canGlobalBlock && (
          <Link
            to="/admin-console"
            search={{ section: "allow-list" }}
            className="cursor-pointer rounded-md bg-white px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg"
          >
            {m.ui_open_allow_list()}
          </Link>
        )}
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
