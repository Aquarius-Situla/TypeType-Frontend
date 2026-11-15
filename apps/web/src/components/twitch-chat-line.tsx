import { memo, useMemo } from "react";
import type { ChatAssets } from "../hooks/use-twitch-chat-assets";
import { proxyImage } from "../lib/proxy";
import { chatNameColor } from "../lib/twitch-chat-color";
import { chatParts, mentions } from "../lib/twitch-chat-parts";
import { m } from "../paraglide/messages.js";
import type { TwitchChatEvent } from "../types/twitch";
import { TwitchChatMessage } from "./twitch-chat-message";

type Props = {
  event: TwitchChatEvent;
  assets: ChatAssets;
  selfLogin: string;
  theme: "dark" | "light";
  onLink: (href: string) => void;
};

function Badges({ ids, assets }: { ids: string[]; assets: ChatAssets }) {
  return ids.map((id) => {
    const badge = assets.badge(id);
    if (!badge) return null;
    return (
      <img
        key={id}
        src={proxyImage(badge.url, "card")}
        srcSet={badge.url2x ? `${proxyImage(badge.url2x, "card")} 2x` : undefined}
        alt={badge.title}
        title={badge.title}
        loading="lazy"
        className="mr-1 inline-block size-[18px] align-[-3px]"
      />
    );
  });
}

export const TwitchChatLine = memo(function TwitchChatLine({
  event,
  assets,
  selfLogin,
  theme,
  onLink,
}: Props) {
  const parts = useMemo(
    () => chatParts(event.text ?? "", event.emotes, assets.emotes, selfLogin),
    [event.text, event.emotes, assets.emotes, selfLogin],
  );
  const highlighted = mentions(parts);
  const name = event.displayName || event.login || "";
  const tone =
    event.type === "notice"
      ? "border-l-2 border-[#9146ff] bg-[#9146ff]/10"
      : highlighted
        ? "border-l-2 border-accent bg-accent/10"
        : "";
  return (
    <li className={`break-words px-3 py-1 text-sm leading-7 ${tone}`}>
      {event.system && <span className="block text-fg-muted text-xs">{event.system}</span>}
      <Badges ids={event.badges ?? []} assets={assets} />
      <span
        className="font-semibold"
        style={{ color: chatNameColor(event.color, event.login ?? name, theme) }}
      >
        {name}
      </span>
      {event.deleted ? (
        <span className="text-fg-muted italic">: {m.twitch_chat_deleted()}</span>
      ) : (
        <>
          {event.text ? <span className="text-fg-muted">{event.action ? " " : ": "}</span> : null}
          <span
            className={event.action ? "italic" : undefined}
            style={event.action ? { color: chatNameColor(event.color, name, theme) } : undefined}
          >
            <TwitchChatMessage parts={parts} onLink={onLink} />
          </span>
        </>
      )}
    </li>
  );
});
