import { expect, test } from "bun:test";
import { keepsAutoLoading, nextEmptyPageStreak } from "../src/hooks/use-feed-auto-load";
import { unwatchedStreams } from "../src/hooks/use-unwatched-streams";
import { progressChunks, videoProgressUrl } from "../src/lib/video-progress";
import type { VideoStream } from "../src/types/stream";
import type { ProgressItem } from "../src/types/user";

function video(index: number): VideoStream {
  return {
    id: `https://www.youtube.com/watch?v=video${index}`,
    duration: 600,
    isLive: false,
  } as VideoStream;
}

function page(from: number): VideoStream[] {
  return Array.from({ length: 30 }, (_, index) => video(from + index));
}

test("a new feed page only adds a progress chunk and keeps the earlier ones", () => {
  const first = page(0);
  const second = [...first, ...page(30)];
  const before = progressChunks(first.map(videoProgressUrl));
  const after = progressChunks(second.map(videoProgressUrl));
  expect(after.slice(0, before.length)).toEqual(before);
  expect(after).toHaveLength(before.length + 1);
  expect(after[after.length - 1]).toEqual(page(30).map(videoProgressUrl));
});

test("videos whose progress is still loading stay hidden", () => {
  const streams = page(0);
  const watched = streams[0];
  const loading = streams.slice(10);
  const byUrl = new Map<string, ProgressItem>([
    [
      videoProgressUrl(watched),
      { videoUrl: videoProgressUrl(watched), position: 600_000, updatedAt: 1 },
    ],
  ]);
  const pending = new Set(loading.map(videoProgressUrl));
  const visible = unwatchedStreams(streams, { byUrl, pending }, 0);
  expect(visible).toEqual(streams.slice(1, 10));
});

test("live videos stay in the feed while their progress loads", () => {
  const live = { ...video(1), isLive: true } as VideoStream;
  const pending = new Set([videoProgressUrl(live)]);
  expect(unwatchedStreams([live], { byUrl: new Map(), pending }, 0)).toEqual([live]);
});

test("automatic loading stops after three pages that show nothing new", () => {
  let streak = 0;
  streak = nextEmptyPageStreak(streak, 0, 0);
  streak = nextEmptyPageStreak(streak, 0, 0);
  expect(keepsAutoLoading(streak)).toBe(true);
  streak = nextEmptyPageStreak(streak, 0, 0);
  expect(keepsAutoLoading(streak)).toBe(false);
});

test("a page that shows a new video resets the count", () => {
  expect(nextEmptyPageStreak(2, 4, 5)).toBe(0);
});
