import danmakuEmotesData from "../data/danmaku-emotes.json" with { type: "json" };

export const REGULAR_DISPLAY_MS = 6000;
const STATIC_DISPLAY_MS = 3000;
export const N_LANES = 8;
export const LANE_HEIGHT_PX = 36;
export const CHAR_WIDTH_PX = 14;

export function argbToColor(argb: number): string {
  const rgb = (argb >>> 0) & 0x00ffffff;
  return `#${rgb.toString(16).padStart(6, "0")}`;
}

export function displayDuration(position: string): number {
  return position === "REGULAR" ? REGULAR_DISPLAY_MS : STATIC_DISPLAY_MS;
}

export type DanmakuPlaybackSyncState = {
  pausedProp?: boolean;
  videoPaused?: boolean;
  mediaPaused?: boolean;
  videoWaiting?: boolean;
  mediaWaiting?: boolean;
  mediaSeeking?: boolean;
  videoSeeking?: boolean;
  isStalled?: boolean;
};

export function isDanmakuPlaybackPaused(state: DanmakuPlaybackSyncState): boolean {
  return Boolean(
    state.pausedProp ||
      state.videoPaused ||
      state.mediaPaused ||
      state.videoWaiting ||
      state.mediaWaiting ||
      state.mediaSeeking ||
      state.videoSeeking ||
      state.isStalled,
  );
}

export interface DanmakuEmote {
  id: string;
  name: string;
  patterns: string[];
  url: string;
  aspectRatio?: number;
  description?: string;
}

export type DanmakuToken =
  | { type: "text"; text: string }
  | { type: "emote"; emote: DanmakuEmote };

export const DANMAKU_EMOTES: DanmakuEmote[] = danmakuEmotesData as DanmakuEmote[];

type CompiledEmoteEngine = {
  regex: RegExp;
  exactMap: Map<string, DanmakuEmote>;
  lowerMap: Map<string, DanmakuEmote>;
};

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildEmoteEngine(emotes: DanmakuEmote[]): CompiledEmoteEngine | null {
  if (!emotes || emotes.length === 0) return null;

  const exactMap = new Map<string, DanmakuEmote>();
  const lowerMap = new Map<string, DanmakuEmote>();
  const allPatterns: { pattern: string; isWord: boolean }[] = [];

  for (const emote of emotes) {
    for (const rawPattern of emote.patterns) {
      if (!rawPattern) continue;
      exactMap.set(rawPattern, emote);
      lowerMap.set(rawPattern.toLowerCase(), emote);
      // Pure ASCII alphanumeric / underscore identifiers are matched with word boundaries
      const isWord = /^[a-zA-Z0-9_]+$/.test(rawPattern);
      allPatterns.push({ pattern: rawPattern, isWord });
    }
  }

  if (allPatterns.length === 0) return null;

  // Sort descending by pattern length so longer prefixes (e.g. [前方高能] vs 前方高能) match first
  allPatterns.sort((a, b) => b.pattern.length - a.pattern.length);

  const regexParts = allPatterns.map(({ pattern, isWord }) => {
    const escaped = escapeRegex(pattern);
    return isWord ? `\\b${escaped}\\b` : escaped;
  });

  const regex = new RegExp(regexParts.join("|"), "g");
  return { regex, exactMap, lowerMap };
}

const DEFAULT_ENGINE = buildEmoteEngine(DANMAKU_EMOTES);

export function parseDanmakuContent(
  text: string,
  emotes: DanmakuEmote[] = DANMAKU_EMOTES,
): DanmakuToken[] {
  if (!text) return [];

  const engine = emotes === DANMAKU_EMOTES ? DEFAULT_ENGINE : buildEmoteEngine(emotes);
  if (!engine) {
    return [{ type: "text", text }];
  }

  const { regex, exactMap, lowerMap } = engine;
  regex.lastIndex = 0;

  const tokens: DanmakuToken[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const matchStart = match.index;
    const matchText = match[0];

    if (matchStart > lastIndex) {
      tokens.push({
        type: "text",
        text: text.slice(lastIndex, matchStart),
      });
    }

    const emote = exactMap.get(matchText) ?? lowerMap.get(matchText.toLowerCase());
    if (emote) {
      tokens.push({ type: "emote", emote });
    } else {
      tokens.push({ type: "text", text: matchText });
    }

    lastIndex = matchStart + matchText.length;
  }

  if (lastIndex < text.length) {
    tokens.push({
      type: "text",
      text: text.slice(lastIndex),
    });
  }

  return tokens;
}

export function estimateDanmakuWidth(tokens: DanmakuToken[], fontSize: number): number {
  let width = 0;
  for (const token of tokens) {
    if (token.type === "text") {
      width += token.text.length * CHAR_WIDTH_PX;
    } else {
      const ratio = token.emote.aspectRatio ?? 1;
      width += Math.round(fontSize * 1.25 * ratio);
    }
  }
  return width;
}
