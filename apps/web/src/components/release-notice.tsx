import { Link } from "@tanstack/react-router";
import { Play, Sparkles, X } from "lucide-react";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { siDiscord, siTwitch } from "simple-icons";
import { useSettings } from "../hooks/use-settings";
import { useTwitchEnabled } from "../hooks/use-twitch";
import { DISCORD_INVITE_URL } from "../lib/discord";
import { m } from "../paraglide/messages.js";
import { ServiceIcon } from "./service-icon";

// Bump with each release that has something to announce: every viewer sees the new notice once.
const RELEASE_NOTICE = "1.18";
const SEEN_KEY = "typetype-release-notice";
const SHOW_DELAY_MS = 2500;
const ACTION =
  "shrink-0 rounded-lg bg-surface-strong px-3 py-1.5 text-xs font-medium text-fg transition-colors hover:bg-surface-soft";
const PRIMARY_ACTION =
  "shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-accent-strong";

function noticeSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === RELEASE_NOTICE;
  } catch {
    return true;
  }
}

function markNoticeSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, RELEASE_NOTICE);
  } catch {
    return;
  }
}

type RowProps = { icon: ReactNode; tint: string; text: string; action?: ReactNode };

function NoticeRow({ icon, tint, text, action }: RowProps) {
  return (
    <li className="release-notice-row flex items-center gap-3">
      <span
        className="flex size-9 shrink-0 items-center justify-center rounded-full"
        style={{ color: tint, backgroundColor: `color-mix(in srgb, ${tint} 16%, transparent)` }}
      >
        {icon}
      </span>
      <p className="min-w-0 flex-1 text-xs text-fg-muted">{text}</p>
      {action}
    </li>
  );
}

// What the release brings, shown once per release after the page had a moment to settle.
export function ReleaseNotice() {
  const { settings, settingsReady, update } = useSettings();
  const twitchEnabled = useTwitchEnabled();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const close = useCallback(() => {
    markNoticeSeen();
    setClosing(true);
  }, []);

  useEffect(() => {
    if (!settingsReady || noticeSeen()) return;
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [settingsReady]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (!open) return null;
  const classicPlayer = settings.playerEngine !== "videojs";
  return createPortal(
    <div
      role="dialog"
      aria-labelledby="release-notice-title"
      data-closing={closing ? "" : undefined}
      onAnimationEnd={(event) => {
        if (closing && event.target === event.currentTarget) setOpen(false);
      }}
      className="release-notice fixed inset-x-4 bottom-4 z-50 flex flex-col gap-4 rounded-2xl border border-border-strong bg-surface p-4 shadow-2xl sm:left-auto sm:right-6 sm:bottom-6 sm:w-96"
    >
      <div className="flex items-center justify-between gap-3">
        <p
          id="release-notice-title"
          className="flex items-center gap-2 text-sm font-semibold text-fg"
        >
          <Sparkles className="size-4 text-accent" aria-hidden="true" />
          {m.release_notice_title()}
        </p>
        <button
          type="button"
          onClick={close}
          aria-label={m.release_notice_close()}
          className="-mr-1 rounded-full p-1 text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <ul className="flex flex-col gap-3">
        <NoticeRow
          icon={<ServiceIcon path={siDiscord.path} color="currentColor" label="Discord" />}
          tint={`#${siDiscord.hex}`}
          text={m.release_notice_discord()}
          action={
            <a href={DISCORD_INVITE_URL} target="_blank" rel="noreferrer" className={ACTION}>
              {m.release_notice_discord_action()}
            </a>
          }
        />
        {twitchEnabled && (
          <NoticeRow
            icon={<ServiceIcon path={siTwitch.path} color="currentColor" label="Twitch" />}
            tint={`#${siTwitch.hex}`}
            text={m.release_notice_twitch()}
            action={
              <Link to="/twitch" onClick={close} className={ACTION}>
                {m.release_notice_twitch_action()}
              </Link>
            }
          />
        )}
        <NoticeRow
          icon={<Play className="size-4" aria-hidden="true" />}
          tint="var(--color-accent)"
          text={classicPlayer ? m.release_notice_videojs() : m.release_notice_videojs_active()}
          action={
            classicPlayer && (
              <button
                type="button"
                onClick={() => {
                  update.mutate({ playerEngine: "videojs" });
                  close();
                }}
                className={PRIMARY_ACTION}
              >
                {m.release_notice_videojs_action()}
              </button>
            )
          }
        />
      </ul>
    </div>,
    document.body,
  );
}
