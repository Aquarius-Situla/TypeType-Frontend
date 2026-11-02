import { expect, test } from "bun:test";
import {
  EMPTY_PLAYBACK_QUEUE,
  enqueuePlaybackEntry,
  nextPlaybackEntry,
  type PlaybackQueue,
  type PlaybackQueueEntry,
  previousPlaybackEntry,
  removePlaybackEntry,
  syncPlaybackQueue,
} from "../src/lib/playback-queue";

const entry = (param: string): PlaybackQueueEntry => ({
  param,
  title: `Video ${param}`,
  thumbnail: "",
  channelName: "Channel",
});

const params = (queue: PlaybackQueue) => queue.entries.map((item) => item.param);

test("starts a queue when nothing plays", () => {
  const mutation = enqueuePlaybackEntry(EMPTY_PLAYBACK_QUEUE, entry("a"), true, null);
  expect(mutation.result).toBe("started");
  expect(params(mutation.queue)).toEqual(["a"]);
  expect(mutation.queue.currentIndex).toBe(0);
});

test("adopts the playing video as the first entry", () => {
  const mutation = enqueuePlaybackEntry(EMPTY_PLAYBACK_QUEUE, entry("b"), false, entry("a"));
  expect(mutation.result).toBe("added");
  expect(params(mutation.queue)).toEqual(["a", "b"]);
  expect(mutation.queue.currentIndex).toBe(0);
});

test("refuses the video that is already playing", () => {
  const mutation = enqueuePlaybackEntry(EMPTY_PLAYBACK_QUEUE, entry("a"), true, entry("a"));
  expect(mutation.result).toBe("alreadyPlaying");
  expect(mutation.queue).toBe(EMPTY_PLAYBACK_QUEUE);
});

test("play next inserts after the current video and add goes to the end", () => {
  const queue = { entries: [entry("a"), entry("b"), entry("c")], currentIndex: 1 };
  expect(params(enqueuePlaybackEntry(queue, entry("d"), true, null).queue)).toEqual([
    "a",
    "b",
    "d",
    "c",
  ]);
  expect(params(enqueuePlaybackEntry(queue, entry("d"), false, null).queue)).toEqual([
    "a",
    "b",
    "c",
    "d",
  ]);
});

test("play next moves a queued video right after the current one", () => {
  const queue = { entries: [entry("a"), entry("b"), entry("c"), entry("d")], currentIndex: 1 };
  const later = enqueuePlaybackEntry(queue, entry("d"), true, null);
  expect(later.result).toBe("moved");
  expect(params(later.queue)).toEqual(["a", "b", "d", "c"]);
  const earlier = enqueuePlaybackEntry(queue, entry("a"), true, null);
  expect(params(earlier.queue)).toEqual(["b", "a", "c", "d"]);
  expect(earlier.queue.currentIndex).toBe(0);
});

test("a video already queued is not added twice", () => {
  const queue = { entries: [entry("a"), entry("b"), entry("c")], currentIndex: 0 };
  expect(enqueuePlaybackEntry(queue, entry("c"), false, null).result).toBe("alreadyQueued");
  expect(enqueuePlaybackEntry(queue, entry("b"), true, null).result).toBe("alreadyQueued");
});

test("opening a queued video moves the position and another video ends the queue", () => {
  const queue = { entries: [entry("a"), entry("b"), entry("c")], currentIndex: 0 };
  expect(syncPlaybackQueue(queue, "a")).toBe(queue);
  expect(syncPlaybackQueue(queue, "c").currentIndex).toBe(2);
  expect(syncPlaybackQueue(queue, "z")).toEqual(EMPTY_PLAYBACK_QUEUE);
});

test("removes upcoming and past videos but never the current one", () => {
  const queue = { entries: [entry("a"), entry("b"), entry("c")], currentIndex: 1 };
  expect(removePlaybackEntry(queue, "b")).toBe(queue);
  const withoutFirst = removePlaybackEntry(queue, "a");
  expect(params(withoutFirst)).toEqual(["b", "c"]);
  expect(withoutFirst.currentIndex).toBe(0);
  expect(params(removePlaybackEntry(queue, "c"))).toEqual(["a", "b"]);
});

test("next and previous follow the queue order", () => {
  const queue = { entries: [entry("a"), entry("b"), entry("c")], currentIndex: 1 };
  expect(nextPlaybackEntry(queue)?.param).toBe("c");
  expect(previousPlaybackEntry(queue)?.param).toBe("a");
  expect(nextPlaybackEntry({ ...queue, currentIndex: 2 })).toBeNull();
  expect(nextPlaybackEntry(EMPTY_PLAYBACK_QUEUE)).toBeNull();
});
