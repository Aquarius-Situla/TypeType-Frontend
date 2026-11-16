import { Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { siDiscord } from "simple-icons";
import { useSettings } from "../hooks/use-settings";
import { DISCORD_INVITE_URL } from "../lib/discord";
import { m } from "../paraglide/messages.js";
import { ServiceIcon } from "./service-icon";

const SEEN_KEY = "typetype-videojs-invite-seen";
const SHOW_DELAY_MS = 4000;

function inviteSeen(): boolean {
  try {
    return window.localStorage.getItem(SEEN_KEY) === "1";
  } catch {
    return true;
  }
}

function markInviteSeen(): void {
  try {
    window.localStorage.setItem(SEEN_KEY, "1");
  } catch {
    return;
  }
}

// Asked once, after playback had a moment to start: the classic player stays the default and the viewer decides.
export function VideoJsInvite() {
  const { update } = useSettings();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => {
    markInviteSeen();
    setOpen(false);
  }, []);

  useEffect(() => {
    if (inviteSeen()) return;
    const timer = window.setTimeout(() => setOpen(true), SHOW_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  if (!open) return null;
  return createPortal(
    <div
      role="dialog"
      aria-labelledby="videojs-invite-title"
      aria-describedby="videojs-invite-body"
      className="fixed inset-x-4 bottom-4 z-50 flex flex-col gap-3 rounded-2xl border border-border-strong bg-surface p-4 shadow-2xl sm:left-auto sm:right-6 sm:bottom-6 sm:w-80"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Sparkles className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p id="videojs-invite-title" className="text-sm font-semibold text-fg">
            {m.videojs_invite_title()}
          </p>
          <p id="videojs-invite-body" className="text-xs text-fg-muted">
            {m.videojs_invite_body()}
          </p>
          <a
            href={DISCORD_INVITE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex w-fit items-center gap-1.5 text-xs font-medium text-accent hover:text-accent-strong"
          >
            <ServiceIcon path={siDiscord.path} color="currentColor" label="Discord" />
            {m.videojs_invite_discord()}
          </a>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label={m.videojs_invite_close()}
          className="-mr-1 -mt-1 rounded-full p-1 text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          className="rounded-lg bg-surface-strong px-3.5 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-soft hover:text-fg"
        >
          {m.videojs_invite_later()}
        </button>
        <button
          type="button"
          onClick={() => {
            update.mutate({ playerEngine: "videojs" });
            close();
          }}
          className="rounded-lg bg-accent px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-accent-strong"
        >
          {m.videojs_invite_try()}
        </button>
      </div>
    </div>,
    document.body,
  );
}
