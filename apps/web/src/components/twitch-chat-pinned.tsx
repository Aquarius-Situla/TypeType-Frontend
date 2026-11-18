import { ChevronDown, Pin, X } from "lucide-react";
import { useState } from "react";
import { m } from "../paraglide/messages.js";
import type { TwitchPinnedMessage } from "../types/twitch";

type Props = { pinned: TwitchPinnedMessage; onHide: () => void };

export function TwitchChatPinned({ pinned, onHide }: Props) {
  const [open, setOpen] = useState(false);
  const author = pinned.displayName || pinned.login;
  return (
    <section
      aria-label={m.twitch_pinned_message()}
      className="flex items-start gap-2 border-border border-b bg-surface-strong/60 px-3 py-2 text-fg"
    >
      <Pin className="mt-0.5 size-3.5 shrink-0 text-[#a970ff]" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-left text-xs"
      >
        <span className="min-w-0 flex-1">
          {pinned.pinnedBy && (
            <span className="block text-[11px] text-fg-muted">
              {m.twitch_pinned_by({ name: pinned.pinnedBy })}
            </span>
          )}
          <span className={`break-words ${open ? "block" : "line-clamp-2"}`}>
            {author && <span className="font-semibold">{author}: </span>}
            {pinned.text}
          </span>
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`mt-0.5 size-3.5 shrink-0 text-fg-muted transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      <button
        type="button"
        onClick={onHide}
        aria-label={m.twitch_chat_highlight_hide()}
        title={m.twitch_chat_highlight_hide()}
        className="shrink-0 rounded p-0.5 text-fg-muted hover:bg-surface-strong hover:text-fg"
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </section>
  );
}
