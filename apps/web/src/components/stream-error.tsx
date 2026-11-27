import { Link, useRouter } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useAuth } from "../hooks/use-auth";
import { familyListBlockedMessage } from "../lib/allow-list-error";
import type { FocusBlockInfo } from "../lib/focus-block-error";
import { parseGeoRestriction } from "../lib/geo-restriction";
import { isMemberOnlyMessage } from "../lib/member-only";
import { type VideoAvailability, videoAvailabilityCopy } from "../lib/video-availability";
import { m } from "../paraglide/messages.js";
import { FailMascot } from "./fail-mascot";
import { FlagIcon } from "./flag-icon";
import { FocusWatchScreen } from "./focus-watch-screen";
import { ReactionGif } from "./reaction-gif";
import { VideoAvailabilityPoster } from "./video-availability-poster";
import { YoutubeIcon } from "./youtube-icon";

type Props = {
  message: string;
  notice?: string;
  onRetry?: () => void;
  youtubeSessionReturnTo?: string;
  youtubeSessionAction?: "connect" | "reconnect";
  familyListBlocked?: boolean;
  focusBlock?: FocusBlockInfo | null;
  focusVideoUrl?: string;
  onFocusAllowOnceSuccess?: () => void;
  availability?: VideoAvailability;
  poster?: string;
};

export function StreamError({
  message,
  notice,
  onRetry,
  youtubeSessionReturnTo,
  youtubeSessionAction,
  familyListBlocked: familyListBlockedOverride,
  focusBlock,
  focusVideoUrl,
  onFocusAllowOnceSuccess,
  availability,
  poster,
}: Props): ReactElement {
  const router = useRouter();
  const { canGlobalBlock } = useAuth();
  const availabilityCopy = availability ? videoAvailabilityCopy(availability, message) : null;
  const displayedMessage = availabilityCopy?.message ?? message;

  if (focusBlock && !availability) {
    return (
      <FocusWatchScreen
        focusBlock={focusBlock}
        message={displayedMessage}
        videoUrl={focusVideoUrl}
        onSuccess={onFocusAllowOnceSuccess}
      />
    );
  }

  const countryCode = parseGeoRestriction(displayedMessage);
  const isMemberOnly = availability === "members_only" || isMemberOnlyMessage(displayedMessage);
  const familyListBlocked = familyListBlockedOverride ?? message === familyListBlockedMessage();
  const youtubeSessionReconnect = youtubeSessionAction === "reconnect";
  const errorImage =
    youtubeSessionReconnect || familyListBlocked || isMemberOnly ? (
      <ReactionGif
        kind={
          youtubeSessionReconnect
            ? "youtubeReconnect"
            : familyListBlocked
              ? "familyListBlocked"
              : "membersOnly"
        }
        size={220}
        className="size-[220px]"
      />
    ) : (
      <FailMascot className="w-56 shrink-0 sm:w-64" />
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
            <p className="text-base font-semibold tracking-tight text-fg">
              {focusBlock ? m.focus_blocked_title() : m.ui_couldn_t_load_this_video()}
            </p>
            <div className="flex items-center gap-2">
              {countryCode && (
                <FlagIcon code={countryCode} className="h-4 w-5 shrink-0 rounded-sm" />
              )}
              <p className="max-w-xs text-center text-sm text-fg-muted">{displayedMessage}</p>
            </div>
            {notice && <p className="text-center text-sm text-fg-soft">{notice}</p>}
          </div>
        </>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        {onRetry && !availability && (
          <button
            type="button"
            onClick={onRetry}
            className="cursor-pointer rounded-md bg-fg px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg-strong"
          >
            {m.ui_retry()}
          </button>
        )}
        {youtubeSessionReturnTo && (
          <Link
            to="/youtube-session"
            search={{ returnTo: youtubeSessionReturnTo }}
            className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-fg px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg-strong"
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
            className="cursor-pointer rounded-md bg-fg px-5 py-2 text-sm font-medium text-app transition-colors hover:bg-fg-strong"
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
