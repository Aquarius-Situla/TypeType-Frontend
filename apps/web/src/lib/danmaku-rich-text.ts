import emoteUrls from "./danmaku-emotes.json";
import { splitVideoIds, type VideoIdMention } from "./video-id-mentions";

export type DanmakuToken =
  | { type: "text"; text: string; start: number }
  | { type: "emote"; code: string; src: string; start: number }
  | ({ type: "video" } & VideoIdMention);

function pushText(tokens: DanmakuToken[], text: string, start: number) {
  for (const part of splitVideoIds(text, start)) {
    if (part.type === "text") tokens.push({ type: "text", text: part.value, start: part.start });
    else tokens.push(part);
  }
}

const EMOTE_CODE_PATTERN = /\[[^[\]]{1,24}\]/g;
const EMOTE_REGISTRY = emoteUrls as Record<string, string>;

export function parseDanmakuRichText(text: string): DanmakuToken[] {
  const tokens: DanmakuToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(EMOTE_CODE_PATTERN)) {
    const src = EMOTE_REGISTRY[match[0]];
    if (!src) continue;
    const index = match.index ?? 0;
    if (index > cursor) pushText(tokens, text.slice(cursor, index), cursor);
    tokens.push({ type: "emote", code: match[0], src, start: index });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) pushText(tokens, text.slice(cursor), cursor);
  return tokens;
}

export function danmakuEmoteUrl(code: string): string | null {
  return EMOTE_REGISTRY[code] ?? null;
}
