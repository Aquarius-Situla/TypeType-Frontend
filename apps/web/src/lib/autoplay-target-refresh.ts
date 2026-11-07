/**
 * Playlist items are rebuilt on every render, so the next target is a new object each time. Keeping the shown
 * target while its content is unchanged stops the countdown from re-rendering the watch page forever.
 */
export function refreshedAutoplayTarget<T extends { id: string }>(
  current: T | null,
  next: T | null,
): T | null {
  if (!current || !next || current.id !== next.id) return null;
  return JSON.stringify(current) === JSON.stringify(next) ? current : next;
}
