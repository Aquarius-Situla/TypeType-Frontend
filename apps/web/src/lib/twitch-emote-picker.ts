import type { TwitchThirdPartyEmote, TwitchUserEmotes } from "../types/twitch";
import { type ChatEmoteImage, twitchEmote } from "./twitch-chat-parts";

export type EmoteGroupId = "channel" | "twitch" | "7tv" | "bttv" | "ffz";

export type EmoteGroup = { id: EmoteGroupId; emotes: ChatEmoteImage[] };

const ORDER: EmoteGroupId[] = ["channel", "twitch", "7tv", "bttv", "ffz"];
const MAX_MESSAGE = 500;

export function emoteGroups(
  account: TwitchUserEmotes | undefined,
  thirdParty: Iterable<TwitchThirdPartyEmote>,
): EmoteGroup[] {
  const groups = new Map<EmoteGroupId, ChatEmoteImage[]>(ORDER.map((id) => [id, []]));
  const names = new Set<string>();
  const add = (id: EmoteGroupId, emote: ChatEmoteImage) => {
    if (names.has(emote.name)) return;
    names.add(emote.name);
    groups.get(id)?.push(emote);
  };
  for (const emote of account?.emotes ?? []) {
    const own = emote.ownerId !== undefined && emote.ownerId === account?.channelId;
    add(own ? "channel" : "twitch", twitchEmote(emote.id, emote.name));
  }
  for (const emote of thirdParty) {
    if (!emote.zeroWidth) add(emote.provider, emote);
  }
  return ORDER.map((id) => ({ id, emotes: groups.get(id) ?? [] })).filter(
    (group) => group.emotes.length > 0,
  );
}

export function filterEmoteGroups(groups: EmoteGroup[], query: string): EmoteGroup[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return groups;
  return groups
    .map((group) => ({
      ...group,
      emotes: group.emotes.filter((emote) => emote.name.toLowerCase().includes(needle)),
    }))
    .filter((group) => group.emotes.length > 0);
}

export function insertEmote(
  draft: string,
  start: number,
  end: number,
  name: string,
): { text: string; caret: number } | null {
  const before = draft.slice(0, start);
  const after = draft.slice(end);
  const lead = before.length > 0 && !/\s$/.test(before) ? " " : "";
  const tail = /^\s/.test(after) ? "" : " ";
  const inserted = `${lead}${name}${tail}`;
  const text = `${before}${inserted}${after}`;
  if (text.trimEnd().length > MAX_MESSAGE) return null;
  return { text, caret: before.length + inserted.length };
}
