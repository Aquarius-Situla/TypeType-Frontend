import { useInterfaceLocale } from "../hooks/use-interface-locale";
import { chatDuration } from "../lib/twitch-duration";
import { m } from "../paraglide/messages.js";
import type { TwitchRoomState } from "../types/twitch";

function modes(room: TwitchRoomState, locale: string): string[] {
  const list: string[] = [];
  if (room.followersOnly === 0) list.push(m.twitch_chat_mode_followers());
  if (room.followersOnly > 0)
    list.push(
      m.twitch_chat_mode_followers_for({ duration: chatDuration(room.followersOnly, locale) }),
    );
  if (room.subsOnly) list.push(m.twitch_chat_mode_subs());
  if (room.emoteOnly) list.push(m.twitch_chat_mode_emotes());
  if (room.slow > 0) list.push(m.twitch_chat_mode_slow({ seconds: String(room.slow) }));
  if (room.uniqueChat) list.push(m.twitch_chat_mode_unique());
  return list;
}

export function TwitchChatModes({ room }: { room: TwitchRoomState | null }) {
  const { locale } = useInterfaceLocale();
  const active = room ? modes(room, locale) : [];
  if (active.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-1.5 border-border border-t px-3 py-2">
      {active.map((label) => (
        <li
          key={label}
          className="rounded-full border border-border bg-app px-2 py-0.5 text-[11px] text-fg-muted"
        >
          {label}
        </li>
      ))}
    </ul>
  );
}
