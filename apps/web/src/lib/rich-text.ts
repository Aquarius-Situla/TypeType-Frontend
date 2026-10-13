import { youtubeVideoId } from "./watch-url";

export type RichTextSegment =
  | { id: string; type: "text"; value: string }
  | { id: string; type: "url"; value: string }
  | { id: string; type: "timecode"; value: string; seconds: number };

type RichTextFormat = "strong" | "em" | "u" | "s" | "code" | "kbd" | "mark";

export type RichTextNode =
  | { type: "text"; value: string }
  | { type: "break" }
  | { type: "link"; href: string; children: RichTextNode[] }
  | { type: "format"; tag: RichTextFormat; children: RichTextNode[] };

const FORMAT_TAGS = new Set([
  "b",
  "strong",
  "em",
  "i",
  "u",
  "s",
  "strike",
  "del",
  "code",
  "kbd",
  "mark",
]);
const BLOCK_TAGS = new Set(["address", "article", "aside", "blockquote", "div", "li", "p", "pre"]);
const OMIT_TAGS = new Set([
  "audio",
  "base",
  "embed",
  "form",
  "iframe",
  "img",
  "link",
  "meta",
  "object",
  "script",
  "style",
  "svg",
  "template",
  "video",
]);

function isSafeHttpUrl(value: string): boolean {
  try {
    const protocol = new URL(value).protocol;
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

function appendBreak(nodes: RichTextNode[]): void {
  if (nodes.length > 0 && nodes.at(-1)?.type !== "break") nodes.push({ type: "break" });
}

function formatTag(tag: string): RichTextFormat | null {
  if (tag === "b") return "strong";
  if (tag === "i") return "em";
  if (tag === "strike" || tag === "del") return "s";
  return FORMAT_TAGS.has(tag) ? (tag as RichTextFormat) : null;
}

function parseChildNodes(nodes: NodeListOf<ChildNode>): RichTextNode[] {
  const result: RichTextNode[] = [];

  for (const node of nodes) {
    if (node.nodeType === 3) {
      if (node.nodeValue) result.push({ type: "text", value: node.nodeValue });
      continue;
    }
    if (node.nodeType !== 1) continue;

    const element = node as Element;
    const tag = element.tagName.toLowerCase();
    if (OMIT_TAGS.has(tag)) continue;
    if (tag === "br") {
      result.push({ type: "break" });
      continue;
    }

    const children = parseChildNodes(element.childNodes);
    if (tag === "a") {
      const href = element.getAttribute("href");
      if (href && isSafeHttpUrl(href)) result.push({ type: "link", href, children });
      else result.push(...children);
      continue;
    }
    const formattedTag = formatTag(tag);
    if (formattedTag) {
      result.push({ type: "format", tag: formattedTag, children });
      continue;
    }
    if (BLOCK_TAGS.has(tag)) {
      appendBreak(result);
      result.push(...children);
      appendBreak(result);
      continue;
    }
    result.push(...children);
  }

  return result;
}

function parseDocument(source: string): HTMLElement | null {
  if (typeof DOMParser === "undefined") return null;
  return new DOMParser().parseFromString(source, "text/html").body;
}

export function parseRichTextMarkup(text: string): RichTextNode[] {
  const body = parseDocument(text);
  if (!body) return [{ type: "text", value: text }];

  let nodes = parseChildNodes(body.childNodes);
  if (body.children.length === 0 && /&lt;\s*(?:a|br|b|strong|em|i|u|s|p|div)\b/i.test(text)) {
    const decoded = body.textContent ?? text;
    const decodedBody = decoded === text ? null : parseDocument(decoded);
    if (decodedBody) nodes = parseChildNodes(decodedBody.childNodes);
  }
  return nodes;
}

function parseTimestampToSeconds(value: string): number | null {
  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((part) => !Number.isFinite(part))) return null;
  if (parts.length === 2) {
    const [minutes, seconds] = parts;
    return minutes * 60 + seconds;
  }
  if (parts.length === 3) {
    const [hours, minutes, seconds] = parts;
    return hours * 3600 + minutes * 60 + seconds;
  }
  return null;
}

function parseTimestampParameter(value: string | null): number | null {
  if (!value) return null;
  if (/^\d+$/.test(value)) {
    const seconds = Number(value);
    return Number.isSafeInteger(seconds) ? seconds : null;
  }

  const clockSeconds = parseTimestampToSeconds(value);
  if (clockSeconds !== null) return clockSeconds;

  const match = value.match(/^(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?$/i);
  if (!match?.slice(1).some(Boolean)) return null;
  const seconds = Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
  return Number.isSafeInteger(seconds) ? seconds : null;
}

export function sameVideoTimestampSeconds(href: string, videoUrl: string): number | null {
  const currentVideoId = youtubeVideoId(videoUrl);
  if (!currentVideoId || youtubeVideoId(href) !== currentVideoId) return null;

  try {
    const url = new URL(href);
    return parseTimestampParameter(url.searchParams.get("t") ?? url.searchParams.get("start"));
  } catch {
    return null;
  }
}

export function parseTextSegments(text: string, idPrefix = ""): RichTextSegment[] {
  const regex = /https?:\/\/[^\s\])"',;:!>]+|\b(?:\d{1,2}:)?[0-5]?\d:[0-5]\d\b/g;
  const segments: RichTextSegment[] = [];
  let lastIndex = 0;
  let counter = 0;
  let match = regex.exec(text);
  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({
        id: `${idPrefix}t${counter++}`,
        type: "text",
        value: text.slice(lastIndex, match.index),
      });
    }
    const value = match[0];
    if (value.startsWith("http://") || value.startsWith("https://")) {
      segments.push({ id: `${idPrefix}u${counter++}`, type: "url", value });
    } else {
      const seconds = parseTimestampToSeconds(value);
      if (seconds === null) segments.push({ id: `${idPrefix}t${counter++}`, type: "text", value });
      else segments.push({ id: `${idPrefix}c${counter++}`, type: "timecode", value, seconds });
    }
    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }
  if (lastIndex < text.length) {
    segments.push({ id: `${idPrefix}t${counter}`, type: "text", value: text.slice(lastIndex) });
  }
  return segments;
}
