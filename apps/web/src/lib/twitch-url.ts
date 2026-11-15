export type TwitchUrlTarget = { c: string } | { v: string };

const LOGIN = /^[a-z0-9_]{1,25}$/i;
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
  if (host !== "twitch.tv" && host !== "www.twitch.tv" && host !== "m.twitch.tv") return null;
  const [first, second] = url.pathname.split("/").filter(Boolean);
  if (first === "videos" && second && /^\d{1,20}$/.test(second)) return { v: second };
  if (first && !second && LOGIN.test(first) && !RESERVED.has(first.toLowerCase()))
    return { c: first.toLowerCase() };
  return null;
}
