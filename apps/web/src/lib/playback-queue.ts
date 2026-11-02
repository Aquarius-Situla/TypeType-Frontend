export type PlaybackQueueEntry = {
  param: string;
  title: string;
  thumbnail: string;
  channelName: string;
  duration?: number;
};

export type PlaybackQueue = {
  entries: PlaybackQueueEntry[];
  currentIndex: number;
};

export type PlaybackQueueResult =
  | "added"
  | "moved"
  | "alreadyQueued"
  | "alreadyPlaying"
  | "started";

export const EMPTY_PLAYBACK_QUEUE: PlaybackQueue = { entries: [], currentIndex: -1 };

export function isPlaybackQueueActive(queue: PlaybackQueue): boolean {
  return queue.currentIndex >= 0 && queue.currentIndex < queue.entries.length;
}

export function enqueuePlaybackEntry(
  queue: PlaybackQueue,
  entry: PlaybackQueueEntry,
  playNext: boolean,
  playing: PlaybackQueueEntry | null,
): { queue: PlaybackQueue; result: PlaybackQueueResult } {
  const base = isPlaybackQueueActive(queue)
    ? queue
    : playing
      ? { entries: [playing], currentIndex: 0 }
      : null;
  if (!base) return { queue: { entries: [entry], currentIndex: 0 }, result: "started" };
  const existing = base.entries.findIndex((item) => item.param === entry.param);
  if (existing === base.currentIndex) return { queue, result: "alreadyPlaying" };
  if (existing >= 0) {
    if (!playNext || existing === base.currentIndex + 1) return { queue, result: "alreadyQueued" };
    return { queue: moveAfterCurrent(base, existing), result: "moved" };
  }
  const entries = [...base.entries];
  entries.splice(playNext ? base.currentIndex + 1 : entries.length, 0, entry);
  return { queue: { entries, currentIndex: base.currentIndex }, result: "added" };
}

function moveAfterCurrent(queue: PlaybackQueue, from: number): PlaybackQueue {
  const entries = [...queue.entries];
  const [moved] = entries.splice(from, 1);
  const currentIndex = from < queue.currentIndex ? queue.currentIndex - 1 : queue.currentIndex;
  entries.splice(currentIndex + 1, 0, moved);
  return { entries, currentIndex };
}

export function syncPlaybackQueue(queue: PlaybackQueue, param: string): PlaybackQueue {
  if (!isPlaybackQueueActive(queue)) return queue;
  const index = queue.entries.findIndex((item) => item.param === param);
  if (index < 0) return EMPTY_PLAYBACK_QUEUE;
  return index === queue.currentIndex ? queue : { ...queue, currentIndex: index };
}

export function removePlaybackEntry(queue: PlaybackQueue, param: string): PlaybackQueue {
  const index = queue.entries.findIndex((item) => item.param === param);
  if (index < 0 || index === queue.currentIndex) return queue;
  return {
    entries: queue.entries.filter((_, itemIndex) => itemIndex !== index),
    currentIndex: index < queue.currentIndex ? queue.currentIndex - 1 : queue.currentIndex,
  };
}

export function nextPlaybackEntry(queue: PlaybackQueue): PlaybackQueueEntry | null {
  return isPlaybackQueueActive(queue) ? (queue.entries[queue.currentIndex + 1] ?? null) : null;
}

export function previousPlaybackEntry(queue: PlaybackQueue): PlaybackQueueEntry | null {
  return isPlaybackQueueActive(queue) ? (queue.entries[queue.currentIndex - 1] ?? null) : null;
}
