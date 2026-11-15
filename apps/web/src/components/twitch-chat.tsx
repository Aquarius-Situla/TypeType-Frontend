import { Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useInternalLink } from "../hooks/use-internal-link";
import { useTwitchAccount } from "../hooks/use-twitch";
import { useTwitchChat } from "../hooks/use-twitch-chat";
import { useTwitchChatAssets } from "../hooks/use-twitch-chat-assets";
import { m } from "../paraglide/messages.js";
import { resolveEffectiveTheme, useThemeStore } from "../stores/theme-store";
import { TwitchChatComposer } from "./twitch-chat-composer";
import { TwitchChatLine } from "./twitch-chat-line";
import { TwitchChatModes } from "./twitch-chat-modes";
import { TwitchExternalLinkDialog } from "./twitch-external-link-dialog";

const PANEL =
  "relative flex h-[28rem] flex-col overflow-hidden rounded-xl border border-border bg-surface lg:h-full";
// Over the video the chat has no backdrop: light text with a shadow, whatever the theme, stays readable on any frame.
const OVERLAY =
  "relative flex h-full flex-col overflow-hidden [text-shadow:0_1px_2px_rgb(0_0_0/0.95),0_0_6px_rgb(0_0_0/0.6)] [--color-border-strong:rgb(255_255_255/0.2)] [--color-border:rgb(255_255_255/0.12)] [--color-fg-muted:rgb(244_244_245/0.75)] [--color-fg-soft:rgb(244_244_245/0.6)] [--color-fg:#f4f4f5] [--color-surface-strong:rgb(255_255_255/0.12)] [--color-surface:transparent]";

type Props = { login: string; overlay?: boolean };

export function TwitchChat({ login, overlay = false }: Props) {
  const { chat, status } = useTwitchChat(login);
  const assets = useTwitchChatAssets(login);
  const account = useTwitchAccount();
  const pageTheme = resolveEffectiveTheme(useThemeStore((s) => s.theme));
  const theme = overlay ? "dark" : pageTheme;
  const [link, setLink] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const selfLogin = account.data?.linked ? (account.data.login ?? "") : "";
  const openInternal = useInternalLink();
  const onLink = useCallback(
    (href: string) => {
      if (!openInternal(href)) setLink(href);
    },
    [openInternal],
  );

  const scrollToEnd = useCallback(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
    setPaused(false);
  }, []);

  useEffect(() => {
    if (!paused && chat.messages.length > 0) scrollToEnd();
  }, [chat.messages, paused, scrollToEnd]);

  return (
    <section aria-label={m.twitch_chat()} className={overlay ? OVERLAY : PANEL}>
      <h2
        className={`flex items-center gap-2 border-border border-b px-3 py-2 font-semibold text-fg text-sm ${overlay ? "sr-only" : ""}`}
      >
        {m.twitch_chat()}
        {status === "reconnecting" && (
          <span role="status" className="font-normal text-fg-muted text-xs">
            {m.twitch_chat_reconnecting()}
          </span>
        )}
      </h2>
      <ol
        ref={listRef}
        aria-live="polite"
        aria-relevant="additions"
        className="flex-1 overflow-y-auto overscroll-contain py-2"
        onScroll={(e) => {
          const el = e.currentTarget;
          setPaused(el.scrollHeight - el.scrollTop - el.clientHeight > 60);
        }}
      >
        {chat.messages.map((event, index) => (
          <TwitchChatLine
            key={event.id ?? `${event.time}-${index}`}
            event={event}
            assets={assets}
            selfLogin={selfLogin}
            theme={theme}
            onLink={onLink}
          />
        ))}
        {chat.messages.length === 0 && (
          <li className="px-3 py-6 text-center text-fg-muted text-sm">
            {status === "reconnecting"
              ? m.twitch_chat_reconnecting()
              : status === "live"
                ? m.twitch_chat_empty()
                : m.twitch_chat_connecting()}
          </li>
        )}
      </ol>
      {paused && (
        <button
          type="button"
          onClick={scrollToEnd}
          className="-translate-x-1/2 absolute bottom-24 left-1/2 rounded-full bg-[#9146ff] px-3 py-1 font-medium text-white text-xs shadow-lg"
        >
          {m.twitch_chat_resume()}
        </button>
      )}
      <TwitchChatModes room={chat.room} />
      {account.data?.linked ? (
        <TwitchChatComposer login={login} room={chat.room} emotes={assets.emotes} />
      ) : (
        <Link
          to="/twitch-session"
          search={{ channel: login }}
          className="border-border border-t px-3 py-2 text-fg-muted text-xs hover:text-fg"
        >
          {m.twitch_chat_read_only()}
        </Link>
      )}
      {link && <TwitchExternalLinkDialog href={link} onClose={() => setLink(null)} />}
    </section>
  );
}
