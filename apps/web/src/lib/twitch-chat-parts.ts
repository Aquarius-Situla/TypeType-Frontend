import type { TwitchChatEmote, TwitchThirdPartyEmote } from "../types/twitch";

export type ChatEmoteImage = { name: string; url: string; url2x?: string };

export type ChatPart =
  | { kind: "text"; text: string }
  | { kind: "emote"; emote: ChatEmoteImage; overlays: ChatEmoteImage[] }
  | { kind: "link"; text: string; href: string }
  | { kind: "mention"; text: string; self: boolean };

export type ChatEmoteMap = ReadonlyMap<string, TwitchThirdPartyEmote>;

const TWITCH_EMOTE_BASE = "https://static-cdn.jtvnw.net/emoticons/v2/";
const LINK = /^(?:https?:\/\/)?(?:[a-z0-9-]+\.)+[a-z]{2,}(?::\d{2,5})?(?:[/?#]\S*)?$/i;
const TRAILING = /[),.!?:;'"\]]+$/;

export function twitchEmote(id: string, name: string): ChatEmoteImage {
  const base = `${TWITCH_EMOTE_BASE}${encodeURIComponent(id)}/default/dark/`;
  return { name, url: `${base}1.0`, url2x: `${base}2.0` };
}

const BARE_TLDS = new Set(
  [
    "com net org info biz xyz io co app dev me tv gg ly to sh so ai fm am",
    "video live stream games game fun art blog club online site store shop tech link page news wiki social media",
    "be fr de uk es it nl eu ru jp cn kr br ca us au ch at se no dk fi pl pt cz ie in mx ar",
  ]
    .join(" ")
    .split(" "),
);

export function linkHref(word: string): string | null {
  if (!LINK.test(word)) return null;
  const schemed = /^https?:\/\//i.test(word);
  try {
    const url = new URL(schemed ? word : `https://${word}`);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const tld = url.hostname.split(".").at(-1) ?? "";
    if (!schemed && !url.hostname.startsWith("www.") && !BARE_TLDS.has(tld)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function pushText(parts: ChatPart[], text: string) {
  if (!text) return;
  const last = parts.at(-1);
  if (last?.kind === "text") last.text += text;
  else parts.push({ kind: "text", text });
}

function lastEmote(parts: ChatPart[]): Extract<ChatPart, { kind: "emote" }> | null {
  const last = parts.at(-1);
  const beforeSpace = last?.kind === "text" && last.text.trim() === "" ? parts.at(-2) : last;
  return beforeSpace?.kind === "emote" ? beforeSpace : null;
}

function pushWord(parts: ChatPart[], word: string, emotes: ChatEmoteMap, self: string) {
  const emote = emotes.get(word);
  if (emote) {
    const image = { name: emote.name, url: emote.url, url2x: emote.url2x };
    const base = emote.zeroWidth ? lastEmote(parts) : null;
    if (base) {
      if (parts.at(-1)?.kind === "text") parts.pop();
      base.overlays.push(image);
    } else {
      parts.push({ kind: "emote", emote: image, overlays: [] });
    }
    return;
  }
  if (word.startsWith("@") && word.length > 1) {
    const name = word.slice(1).replace(TRAILING, "");
    parts.push({ kind: "mention", text: `@${name}`, self: name.toLowerCase() === self });
    pushText(parts, word.slice(name.length + 1));
    return;
  }
  const trimmed = word.replace(TRAILING, "");
  const href = linkHref(trimmed);
  if (href) {
    parts.push({ kind: "link", text: trimmed, href });
    pushText(parts, word.slice(trimmed.length));
    return;
  }
  pushText(parts, word);
}

function pushSegment(parts: ChatPart[], text: string, emotes: ChatEmoteMap, self: string) {
  for (const token of text.split(/(\s+)/)) {
    if (!token) continue;
    if (/^\s+$/.test(token)) pushText(parts, token);
    else pushWord(parts, token, emotes, self);
  }
}

export function chatParts(
  text: string,
  native: TwitchChatEmote[] = [],
  emotes: ChatEmoteMap = new Map(),
  selfLogin = "",
): ChatPart[] {
  const chars = Array.from(text);
  const ranges = native
    .filter((e) => e.start >= 0 && e.end < chars.length && e.start <= e.end)
    .sort((a, b) => a.start - b.start);
  const self = selfLogin.toLowerCase();
  const parts: ChatPart[] = [];
  let cursor = 0;
  for (const range of ranges) {
    if (range.start < cursor) continue;
    pushSegment(parts, chars.slice(cursor, range.start).join(""), emotes, self);
    const name = chars.slice(range.start, range.end + 1).join("");
    parts.push({ kind: "emote", emote: twitchEmote(range.id, name), overlays: [] });
    cursor = range.end + 1;
  }
  pushSegment(parts, chars.slice(cursor).join(""), emotes, self);
  return parts;
}

export function mentions(parts: ChatPart[]): boolean {
  return parts.some((part) => part.kind === "mention" && part.self);
}
