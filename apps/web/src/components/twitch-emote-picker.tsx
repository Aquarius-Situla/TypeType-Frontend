import { Smile } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTwitchEmotePicker } from "../hooks/use-twitch-emote-picker";
import { proxyImage } from "../lib/proxy";
import type { ChatEmoteImage, ChatEmoteMap } from "../lib/twitch-chat-parts";
import { type EmoteGroup, type EmoteGroupId, filterEmoteGroups } from "../lib/twitch-emote-picker";
import { m } from "../paraglide/messages.js";

const GROUP_PREVIEW = 120;

type Props = { login: string; emotes: ChatEmoteMap; onPick: (name: string) => void };

function groupLabel(id: EmoteGroupId): string {
  if (id === "channel") return m.twitch_emotes_channel();
  if (id === "twitch") return "Twitch";
  if (id === "7tv") return "7TV";
  return id === "bttv" ? "BetterTTV" : "FrankerFaceZ";
}

function EmoteButton({ emote, onPick }: { emote: ChatEmoteImage; onPick: (name: string) => void }) {
  return (
    <button
      type="button"
      title={emote.name}
      aria-label={emote.name}
      onClick={() => onPick(emote.name)}
      className="flex size-10 cursor-pointer items-center justify-center rounded-md hover:bg-surface-strong focus-visible:outline-2 focus-visible:outline-accent"
    >
      <img
        src={proxyImage(emote.url, "card")}
        srcSet={emote.url2x ? `${proxyImage(emote.url2x, "card")} 2x` : undefined}
        alt=""
        loading="lazy"
        decoding="async"
        className="max-h-8 max-w-8"
      />
    </button>
  );
}

function EmoteSection({ group, onPick }: { group: EmoteGroup; onPick: (name: string) => void }) {
  const [all, setAll] = useState(false);
  const shown = all ? group.emotes : group.emotes.slice(0, GROUP_PREVIEW);
  return (
    <section aria-label={groupLabel(group.id)}>
      <h3 className="sticky top-0 bg-surface px-1 py-1 font-medium text-fg-muted text-xs">
        {groupLabel(group.id)}
      </h3>
      <div className="grid grid-cols-7 gap-0.5">
        {shown.map((emote) => (
          <EmoteButton key={emote.name} emote={emote} onPick={onPick} />
        ))}
      </div>
      {shown.length < group.emotes.length && (
        <button
          type="button"
          onClick={() => setAll(true)}
          className="mt-1 w-full cursor-pointer rounded-md py-1 text-accent text-xs hover:bg-surface-strong"
        >
          {m.twitch_emotes_show_all({ count: String(group.emotes.length) })}
        </button>
      )}
    </section>
  );
}

export function TwitchEmotePicker({ login, emotes, onPick }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const picker = useTwitchEmotePicker(login, emotes, open);
  const groups = filterEmoteGroups(picker.groups, query);

  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === "Escape"
          : !rootRef.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={m.twitch_emotes_open()}
        aria-expanded={open}
        title={m.twitch_emotes_open()}
        onClick={() => setOpen((value) => !value)}
        className="flex size-9 cursor-pointer items-center justify-center rounded-lg text-fg-muted hover:bg-surface-strong hover:text-fg"
      >
        <Smile className="size-5" aria-hidden="true" />
      </button>
      {open && (
        <div
          role="dialog"
          aria-label={m.twitch_emotes_open()}
          className="absolute right-0 bottom-full z-30 mb-2 flex max-h-80 w-80 max-w-[calc(100vw-2rem)] flex-col gap-2 rounded-xl border border-border bg-surface p-2 shadow-xl"
        >
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={m.twitch_emotes_search()}
            aria-label={m.twitch_emotes_search()}
            className="rounded-lg border border-border bg-app px-3 py-1.5 text-fg text-sm"
          />
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {groups.map((group) => (
              <EmoteSection key={`${group.id}:${query}`} group={group} onPick={onPick} />
            ))}
            {groups.length === 0 && (
              <p className="px-2 py-4 text-center text-fg-soft text-xs">
                {picker.loading ? m.ui_loading() : m.twitch_emotes_empty()}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
