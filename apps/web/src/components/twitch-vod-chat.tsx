import { useCallback, useEffect, useRef, useState } from "react";
import { useInternalLink } from "../hooks/use-internal-link";
import { useTwitchChatAssets } from "../hooks/use-twitch-chat-assets";
import { useTwitchVodChat } from "../hooks/use-twitch-vod-chat";
import { TWITCH_CHAT_OVERLAY, TWITCH_CHAT_PANEL } from "../lib/twitch-chat-classes";
import { m } from "../paraglide/messages.js";
import { resolveEffectiveTheme, useThemeStore } from "../stores/theme-store";
import { TwitchChatLine } from "./twitch-chat-line";
import { TwitchExternalLinkDialog } from "./twitch-external-link-dialog";

type Props = { videoId: string; login: string; seconds: number; overlay?: boolean };

// The chat of a past broadcast as it scrolled at that moment of the video, drawn by the live chat line.
export function TwitchVodChat({ videoId, login, seconds, overlay = false }: Props) {
  const { comments, ready, unavailable } = useTwitchVodChat(videoId, seconds);
  const assets = useTwitchChatAssets(login);
  const pageTheme = resolveEffectiveTheme(useThemeStore((state) => state.theme));
  const theme = overlay ? "dark" : pageTheme;
  const [link, setLink] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const listRef = useRef<HTMLOListElement>(null);
  const openInternal = useInternalLink();
  const onLink = useCallback((href: string) => openInternal(href, setLink), [openInternal]);

  useEffect(() => {
    const list = listRef.current;
    if (list && !paused && comments.length > 0) list.scrollTop = list.scrollHeight;
  }, [comments, paused]);

  return (
    <section
      aria-label={m.twitch_chat_replay()}
      className={overlay ? TWITCH_CHAT_OVERLAY : TWITCH_CHAT_PANEL}
    >
      <h2
        className={`border-border border-b px-3 py-2 font-semibold text-fg text-sm ${overlay ? "sr-only" : ""}`}
      >
        {m.twitch_chat_replay()}
      </h2>
      <ol
        ref={listRef}
        className="flex-1 overflow-y-auto overscroll-contain py-2"
        onScroll={(event) => {
          const el = event.currentTarget;
          setPaused(el.scrollHeight - el.scrollTop - el.clientHeight > 60);
        }}
      >
        {comments.map((comment) => (
          <TwitchChatLine
            key={comment.id}
            event={{ ...comment, type: "message", time: "" }}
            assets={assets}
            selfLogin=""
            theme={theme}
            onLink={onLink}
          />
        ))}
        {comments.length === 0 && (
          <li className="px-3 py-6 text-center text-fg-muted text-sm">
            {unavailable
              ? m.twitch_chat_replay_unavailable()
              : ready
                ? m.twitch_chat_replay_empty()
                : m.twitch_chat_connecting()}
          </li>
        )}
      </ol>
      {link && <TwitchExternalLinkDialog href={link} onClose={() => setLink(null)} />}
    </section>
  );
}
