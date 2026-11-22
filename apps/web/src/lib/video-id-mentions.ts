import { bilibiliBvidFromAvid } from "./bilibili-av";
import { resolveInternalLink } from "./internal-link";

export type VideoIdMention = { raw: string; id: string; url: string; path: string; start: number };
export type VideoIdPart =
  | { type: "text"; value: string; start: number }
  | ({ type: "video" } & VideoIdMention);

// Two digits at least for av ids, so the AV1 codec named in a comment stays plain text.
const VIDEO_ID = /BV[A-Za-z0-9]{10}|[aA][vV]\d{2,16}|(?:[sS][mM]|[sS][oO]|[nN][mM])\d{1,12}/g;
const WORD_CHAR = /[A-Za-z0-9_]/;

function isWordChar(char: string | undefined): boolean {
  return char !== undefined && WORD_CHAR.test(char);
}

function mention(raw: string, start: number): VideoIdMention | null {
  const lower = raw.toLowerCase();
  const isAv = lower.startsWith("av");
  const bvid = raw.startsWith("BV") ? raw : isAv ? bilibiliBvidFromAvid(raw.slice(2)) : null;
  if (isAv && !bvid) return null;
  const url = bvid
    ? `https://www.bilibili.com/video/${bvid}`
    : `https://www.nicovideo.jp/watch/${lower}`;
  const path = resolveInternalLink(url, { twitch: false });
  if (!path?.startsWith("/watch?")) return null;
  return { raw, id: bvid && !isAv ? bvid : lower, url, path, start };
}

export function splitVideoIds(text: string, offset = 0): VideoIdPart[] {
  const parts: VideoIdPart[] = [];
  let cursor = 0;
  for (const match of text.matchAll(VIDEO_ID)) {
    const index = match.index ?? 0;
    const raw = match[0];
    if (isWordChar(text[index - 1]) || isWordChar(text[index + raw.length])) continue;
    const found = mention(raw, offset + index);
    if (!found) continue;
    if (index > cursor)
      parts.push({ type: "text", value: text.slice(cursor, index), start: offset + cursor });
    parts.push({ type: "video", ...found });
    cursor = index + raw.length;
  }
  if (cursor < text.length)
    parts.push({ type: "text", value: text.slice(cursor), start: offset + cursor });
  return parts;
}
