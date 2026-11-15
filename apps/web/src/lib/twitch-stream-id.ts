export type TwitchWatchTarget = { c?: string; v?: string; clip?: string };

const PREFIX = "twitch:";

export function twitchStreamId(target: TwitchWatchTarget): string {
  if (target.c) return `${PREFIX}live:${target.c.toLowerCase()}`;
  if (target.v) return `${PREFIX}video:${target.v}`;
  return `${PREFIX}clip:${target.clip ?? ""}`;
}

export function isTwitchStreamId(streamId: string): boolean {
  return streamId.startsWith(PREFIX);
}

function searchValue(raw: string | null): string | undefined {
  const value = raw?.trim();
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return typeof parsed === "string" || typeof parsed === "number" ? String(parsed) : value;
  } catch {
    return value;
  }
}

export function twitchStreamIdFromSearch(search: URLSearchParams): string | null {
  const c = searchValue(search.get("c"));
  const v = searchValue(search.get("v"));
  const clip = searchValue(search.get("clip"));
  if (!c && !v && !clip) return null;
  return twitchStreamId({ c: c || undefined, v: v || undefined, clip: clip || undefined });
}
