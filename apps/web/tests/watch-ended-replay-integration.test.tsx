import { expect, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";
import { useWatchPlayerEvents } from "../src/hooks/use-watch-player-events";
import { useWatchProgressPersistence } from "../src/hooks/use-watch-progress-persistence";
import type { VideoStream } from "../src/types/stream";

function makeStream(overrides: Partial<VideoStream> = {}): VideoStream {
  return {
    id: "stream-1",
    title: "Test video",
    thumbnail: "",
    rawThumbnail: "",
    rawChannelAvatar: "",
    channelName: "Test channel",
    channelAvatar: "",
    views: 100,
    duration: 300,
    ...overrides,
  };
}

test("useWatchProgressPersistence saves durationMs on ended and allows seeking back to 0ms afterward", () => {
  const saves: Array<{ positionMs: number; keepalive: boolean }> = [];
  let hookResult: ReturnType<typeof useWatchProgressPersistence> | null = null;

  function Harness() {
    hookResult = useWatchProgressPersistence({
      durationSec: 180,
      isLive: false,
      mutate: (positionMs, keepalive) => {
        saves.push({ positionMs, keepalive });
      },
    });
    return null;
  }

  renderToStaticMarkup(<Harness />);
  expect(hookResult).not.toBeNull();
  if (!hookResult) return;

  hookResult.handleTimeUpdate(10_000);
  expect(saves).toEqual([{ positionMs: 10_000, keepalive: false }]);

  hookResult.handleEnded();
  expect(saves).toEqual([
    { positionMs: 10_000, keepalive: false },
    { positionMs: 180_000, keepalive: true },
  ]);

  hookResult.handleTimeUpdate(0);
  hookResult.handleSeeked();
  expect(saves).toEqual([
    { positionMs: 10_000, keepalive: false },
    { positionMs: 180_000, keepalive: true },
    { positionMs: 0, keepalive: false },
  ]);
});

test("useWatchProgressPersistence allows resetting to 0ms after ended even if user previously seeked to 0ms", () => {
  const saves: Array<{ positionMs: number; keepalive: boolean }> = [];
  let hookResult: ReturnType<typeof useWatchProgressPersistence> | null = null;

  function Harness() {
    hookResult = useWatchProgressPersistence({
      durationSec: 120,
      isLive: false,
      mutate: (positionMs, keepalive) => {
        saves.push({ positionMs, keepalive });
      },
    });
    return null;
  }

  renderToStaticMarkup(<Harness />);
  if (!hookResult) throw new Error("Expected hook result");

  hookResult.handleTimeUpdate(0);
  hookResult.handleSeeked();
  hookResult.handleTimeUpdate(60_000);
  hookResult.handleEnded();
  hookResult.handleTimeUpdate(0);
  hookResult.handleSeeked();

  expect(saves).toEqual([
    { positionMs: 60_000, keepalive: false },
    { positionMs: 120_000, keepalive: true },
    { positionMs: 0, keepalive: false },
  ]);
});

test("useWatchPlayerEvents persists final duration before calling onEnded", () => {
  const callOrder: string[] = [];
  let hookResult: ReturnType<typeof useWatchPlayerEvents> | null = null;

  function Harness() {
    hookResult = useWatchPlayerEvents({
      stream: makeStream({ duration: 245 }),
      isLive: false,
      mutate: (positionMs, keepalive) => {
        callOrder.push(`mutate:${positionMs}:${keepalive}`);
      },
      onEnded: () => {
        callOrder.push("onEnded");
      },
    });
    return null;
  }

  renderToStaticMarkup(<Harness />);
  expect(hookResult).not.toBeNull();
  if (!hookResult) return;

  hookResult.handleEnded();

  expect(callOrder).toEqual(["mutate:245000:true", "onEnded"]);
});

test("useWatchProgressPersistence skips all persistence when isLive is true", () => {
  const saves: Array<{ positionMs: number; keepalive: boolean }> = [];
  let hookResult: ReturnType<typeof useWatchProgressPersistence> | null = null;

  function Harness() {
    hookResult = useWatchProgressPersistence({
      durationSec: 180,
      isLive: true,
      mutate: (positionMs, keepalive) => {
        saves.push({ positionMs, keepalive });
      },
    });
    return null;
  }

  renderToStaticMarkup(<Harness />);
  if (!hookResult) throw new Error("Expected hook result");

  hookResult.handleTimeUpdate(10_000);
  hookResult.handlePause();
  hookResult.handleSeeked();
  hookResult.handleEnded();

  expect(saves).toEqual([]);
});
