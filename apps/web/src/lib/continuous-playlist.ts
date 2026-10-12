import { randomShuffleSeed, shuffleByKey } from "./playlist-shuffle";

export type PlaylistSession = { key: string; visited: string[] };

export type PlaylistPlan<T> = {
  videos: T[];
  previous: T | undefined;
  next: T | undefined;
  session: PlaylistSession;
};

export function playlistShuffleSeed(mode: "off" | "once" | "continuous", current: string) {
  if (mode === "off") return undefined;
  const seed = randomShuffleSeed();
  return mode === "continuous"
    ? `continuous:${seed}`
    : `once:${seed}:${encodeURIComponent(current)}`;
}

export function onceShuffledPlaylist<T>(
  items: T[],
  identify: (item: T) => string,
  key: string,
): T[] {
  if (!key.startsWith("once:")) return shuffleByKey(items, key);
  const separator = key.indexOf(":", 5);
  if (separator < 0) return shuffleByKey(items, key);
  let start: string;
  try {
    start = decodeURIComponent(key.slice(separator + 1));
  } catch {
    return shuffleByKey(items, key);
  }
  const unique = new Map(items.map((item) => [identify(item), item]));
  const first = unique.get(start);
  unique.delete(start);
  return [...(first ? [first] : []), ...shuffleByKey([...unique.values()], key)];
}

export function continuousPlaylist<T>(
  items: T[],
  identify: (item: T) => string,
  session: PlaylistSession,
  key: string,
  current: string,
): PlaylistPlan<T> {
  const byId = new Map(items.map((item) => [identify(item), item]));
  const known = [...byId.keys()];
  let visited = session.key === key ? session.visited.filter((id) => byId.has(id)) : [];
  if (!visited.includes(current)) visited = [...visited, current];
  let unplayed = known.filter((id) => !visited.includes(id));
  if (unplayed.length === 0) {
    // Every remaining song was played: this round ends and a new one starts.
    visited = visited.filter((id) => id === current);
    unplayed = known.filter((id) => !visited.includes(id));
  }
  const remaining = shuffleByKey(
    unplayed.map((id) => byId.get(id)),
    `${key}:${visited.join(",")}`,
  ).filter((item): item is T => item !== undefined);
  const history = visited.flatMap((id) => {
    const item = byId.get(id);
    return item ? [item] : [];
  });
  const index = visited.indexOf(current);
  return {
    videos: [...history, ...remaining],
    previous: index > 0 ? byId.get(visited[index - 1]) : undefined,
    next: remaining[0],
    session: { key, visited },
  };
}
