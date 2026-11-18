export type TwitchUrlTarget = { c: string } | { v: string } | { clip: string };

const LOGIN = /^[a-z0-9_]{1,25}$/i;
const CLIP = /^[A-Za-z0-9_-]{4,100}$/;
const RESERVED = new Set([
  "videos",
  "directory",
  "search",
  "settings",
  "downloads",
  "p",
  "jobs",
  "turbo",
  "subscriptions",
]);

export function twitchUrlTarget(text: string): TwitchUrlTarget | null {
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text.trim()) ? text.trim() : `https://${text.trim()}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  const [first, second, third] = url.pathname.split("/").filter(Boolean);
  if (host === "clips.twitch.tv") {
    return first && !second && CLIP.test(first) ? { clip: first } : null;
  }
  if (host !== "twitch.tv" && host !== "www.twitch.tv" && host !== "m.twitch.tv") return null;
  if (first && second === "clip" && third && LOGIN.test(first) && CLIP.test(third))
    return { clip: third };
  if (first === "videos" && second && /^\d{1,20}$/.test(second)) return { v: second };
  if (first && !second && LOGIN.test(first) && !RESERVED.has(first.toLowerCase()))
    return { c: first.toLowerCase() };
  return null;
}
