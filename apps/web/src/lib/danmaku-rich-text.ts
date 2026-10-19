import emoteUrls from "./danmaku-emotes.json";

export type DanmakuToken =
  | { type: "text"; text: string; start: number }
  | { type: "emote"; code: string; src: string; start: number };

const EMOTE_CODE_PATTERN = /\[[^[\]]{1,24}\]/g;
const EMOTE_REGISTRY = emoteUrls as Record<string, string>;

export function parseDanmakuRichText(text: string): DanmakuToken[] {
  const tokens: DanmakuToken[] = [];
  let cursor = 0;
  for (const match of text.matchAll(EMOTE_CODE_PATTERN)) {
    const src = EMOTE_REGISTRY[match[0]];
    if (!src) continue;
    const index = match.index ?? 0;
    if (index > cursor)
      tokens.push({ type: "text", text: text.slice(cursor, index), start: cursor });
    tokens.push({ type: "emote", code: match[0], src, start: index });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) tokens.push({ type: "text", text: text.slice(cursor), start: cursor });
  return tokens;
}

export function danmakuEmoteUrl(code: string): string | null {
  return EMOTE_REGISTRY[code] ?? null;
}
