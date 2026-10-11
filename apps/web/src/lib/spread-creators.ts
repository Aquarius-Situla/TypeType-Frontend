const APART = 3;

/**
 * Puts the same videos in an order where neighbours are not by the same creator, and a
 * creator does not come back within a few cards, whenever the list allows it. Nothing is
 * added or dropped, a creator's own videos keep their order, and a video only moves back as
 * far as it takes to let other creators in.
 *
 * `settled` is the order already on screen: those videos stay where they are and only what
 * arrived since is placed after them, so a page that grows never reshuffles what was read.
 */
export function spreadCreators<T>(
  items: readonly T[],
  creatorOf: (item: T) => string,
  settled: readonly T[] = [],
): T[] {
  const present = new Set(items);
  const spread = settled.filter((item) => present.has(item));
  const placed = new Set(spread);
  const waiting = items.filter((item) => !placed.has(item));
  while (waiting.length > 0) {
    const chosen = pressing(waiting, spread, creatorOf) ?? farthest(waiting, spread, creatorOf);
    const [next] = waiting.splice(chosen, 1);
    if (next === undefined) break;
    spread.push(next);
  }
  return spread;
}

/**
 * A creator who has more videos left than everyone else together must be placed now, or their
 * videos end up side by side at the bottom: their next one, unless they were just shown.
 */
function pressing<T>(
  waiting: readonly T[],
  spread: readonly T[],
  creatorOf: (item: T) => string,
): number | null {
  const left = new Map<string, number>();
  for (const item of waiting) {
    const creator = creatorOf(item);
    if (creator !== "") left.set(creator, (left.get(creator) ?? 0) + 1);
  }
  const last = spread.at(-1);
  const previous = last === undefined ? null : creatorOf(last);
  for (const [creator, count] of left) {
    if (count > waiting.length - count && creator !== previous) {
      return waiting.findIndex((item) => creatorOf(item) === creator);
    }
  }
  return null;
}

function farthest<T>(
  waiting: readonly T[],
  spread: readonly T[],
  creatorOf: (item: T) => string,
): number {
  for (let apart = APART; apart > 0; apart -= 1) {
    const recent = new Set(spread.slice(Math.max(0, spread.length - apart)).map(creatorOf));
    const found = waiting.findIndex((item) => {
      const creator = creatorOf(item);
      return creator === "" || !recent.has(creator);
    });
    if (found !== -1) return found;
  }
  return 0;
}
