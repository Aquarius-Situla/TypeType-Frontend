import { expect, test } from "bun:test";
import type * as dashjs from "dashjs";
import {
  attachDashPlaybackStallRecovery,
  findBufferedNudge,
  findNextBufferedGap,
  readMediaTimeRanges,
  type TimeRange,
} from "../src/lib/dash-playback-stall-recovery";

test("findNextBufferedGap identifies gaps between current time and next buffered chunk", () => {
  const empty: TimeRange[] = [];
  expect(findNextBufferedGap(empty, 10)).toBeNull();

  const ranges: TimeRange[] = [
    { start: 5, end: 10 },
    { start: 11.2, end: 20 },
  ];
  // Inside first range with remaining buffer > 0.1s: must NOT jump over valid content
  expect(findNextBufferedGap(ranges, 6)).toBeNull();
  expect(findNextBufferedGap(ranges, 8)).toBeNull();

  // At the end edge of first range (remaining <= 0.1s, gap 1.25s <= 1.5s): jumps to next range start + 0.02
  expect(findNextBufferedGap(ranges, 9.95)).toBeCloseTo(11.22, 2);

  // In between ranges (unbuffered hole): gap is 11.2 - 10.5 = 0.7s <= 1.5s
  expect(findNextBufferedGap(ranges, 10.5)).toBeCloseTo(11.22, 2);

  // Gap > 1.5s (e.g. 2.05s ahead): must NOT skip content still being fetched
  const farRanges: TimeRange[] = [
    { start: 5, end: 10 },
    { start: 12, end: 20 },
  ];
  expect(findNextBufferedGap(farRanges, 9.95)).toBeNull();
  expect(findNextBufferedGap([{ start: 30, end: 40 }], 10)).toBeNull();
});

test("findBufferedNudge nudges currentTime forward within the current buffered range", () => {
  const ranges: TimeRange[] = [{ start: 10, end: 20 }];

  // Inside buffer at 15s: attempt 1 nudges by 0.12s
  expect(findBufferedNudge(ranges, 15, 1)).toBeCloseTo(15.12, 2);
  // Inside buffer at 15s: attempt 2 nudges by 0.24s
  expect(findBufferedNudge(ranges, 15, 2)).toBeCloseTo(15.24, 2);

  // Near the end of the range: capped at range.end - 0.02
  expect(findBufferedNudge(ranges, 19.9, 1)).toBeCloseTo(19.98, 2);
  // Too close to end of range (remaining <= 0.05s): returns null to avoid pushing past buffer
  expect(findBufferedNudge(ranges, 19.96, 1)).toBeNull();

  // Not inside any range
  expect(findBufferedNudge(ranges, 5, 1)).toBeNull();
  expect(findBufferedNudge(ranges, 25, 1)).toBeNull();

  // With stallAnchorTime provided:
  // Stall anchor at 15s, attempt 2: nudges by anchor + 0.24 = 15.24
  expect(findBufferedNudge(ranges, 15, 2, 15)).toBeCloseTo(15.24, 2);
  // If currentTime moved past anchor (e.g. at 15.5s), nudge never goes backward:
  expect(findBufferedNudge(ranges, 15.5, 1, 15)).toBeCloseTo(15.62, 2);
});

test("readMediaTimeRanges converts DOM TimeRanges accurately", () => {
  expect(readMediaTimeRanges(null)).toEqual([]);
  expect(readMediaTimeRanges(undefined)).toEqual([]);

  const mockTimeRanges = {
    length: 2,
    start: (index: number) => (index === 0 ? 0 : 15),
    end: (index: number) => (index === 0 ? 10 : 25),
  };
  expect(readMediaTimeRanges(mockTimeRanges)).toEqual([
    { start: 0, end: 10 },
    { start: 15, end: 25 },
  ]);
});

function fakeDashPlayer(initialState: {
  currentTime?: number;
  paused?: boolean;
  seeking?: boolean;
  buffered?: { length: number; start(i: number): number; end(i: number): number };
}) {
  const listeners = new Map<string, (event: unknown) => void>();
  const seeks: number[] = [];
  const state = {
    currentTime: initialState.currentTime ?? 10,
    paused: initialState.paused ?? false,
    seeking: initialState.seeking ?? false,
    ended: false,
    buffered: initialState.buffered ?? { length: 0, start: () => 0, end: () => 0 },
  };

  const video = {
    get currentTime() {
      return state.currentTime;
    },
    set currentTime(value: number) {
      state.currentTime = value;
    },
    get paused() {
      return state.paused;
    },
    get seeking() {
      return state.seeking;
    },
    get ended() {
      return state.ended;
    },
    get buffered() {
      return state.buffered;
    },
    play: () => Promise.resolve(),
  } as unknown as HTMLVideoElement;

  const player = {
    getVideoElement: () => video,
    seek: (time: number) => {
      seeks.push(time);
      state.currentTime = time;
    },
    on: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
    off: (type: string, _listener: unknown) => listeners.delete(type),
  } as unknown as dashjs.MediaPlayerClass;

  const library = {
    MediaPlayer: {
      events: {
        PLAYBACK_PLAYING: "playbackPlaying",
        PLAYBACK_PAUSED: "playbackPaused",
        PLAYBACK_ENDED: "playbackEnded",
        PLAYBACK_SEEKED: "playbackSeeked",
        PLAYBACK_TIME_UPDATED: "playbackTimeUpdated",
        PLAYBACK_WAITING: "playbackWaiting",
        PLAYBACK_STALLED: "playbackStalled",
        BUFFER_EMPTY: "bufferStalled",
        STREAM_TEARDOWN_COMPLETE: "streamTeardownComplete",
      },
    },
  } as unknown as typeof dashjs;

  return { player, library, listeners, seeks, state };
}

test("attachDashPlaybackStallRecovery bridges gaps when stalled near edge of buffer", () => {
  let scheduledCallback: (() => void) | null = null;
  const mockSchedule = (cb: () => void) => {
    scheduledCallback = cb;
    return () => {
      scheduledCallback = null;
    };
  };

  // Video is stalled at the edge of chunk [5, 10] with gap to [11.2, 20] (1.25s <= 1.5s)
  const gapSetup = fakeDashPlayer({
    currentTime: 9.95,
    buffered: {
      length: 2,
      start: (i: number) => (i === 0 ? 5 : 11.2),
      end: (i: number) => (i === 0 ? 10 : 20),
    },
  });

  const cleanupGap = attachDashPlaybackStallRecovery(
    gapSetup.player,
    gapSetup.library,
    mockSchedule,
  );
  expect(scheduledCallback).toBeNull();

  gapSetup.listeners.get("playbackWaiting")?.({});
  expect(scheduledCallback).not.toBeNull();

  scheduledCallback?.();
  expect(gapSetup.seeks).toHaveLength(1);
  expect(gapSetup.seeks[0]).toBeCloseTo(11.22, 2);
  cleanupGap();
});

test("attachDashPlaybackStallRecovery nudges keyframes and stops at max attempts", () => {
  let scheduledCallback: (() => void) | null = null;
  const mockSchedule = (cb: () => void) => {
    scheduledCallback = cb;
    return () => {
      scheduledCallback = null;
    };
  };

  // Video is stalled inside buffer [5, 20] at 10s (decoder waiting on keyframe)
  const stallSetup = fakeDashPlayer({
    currentTime: 10,
    buffered: {
      length: 1,
      start: (i: number) => (i === 0 ? 5 : 0),
      end: (i: number) => (i === 0 ? 20 : 0),
    },
  });

  const cleanupStall = attachDashPlaybackStallRecovery(
    stallSetup.player,
    stallSetup.library,
    mockSchedule,
  );

  // Attempt 1: nudges from 10 to 10.12
  stallSetup.listeners.get("playbackStalled")?.({});
  expect(scheduledCallback).not.toBeNull();
  scheduledCallback?.();
  expect(stallSetup.seeks).toHaveLength(1);
  expect(stallSetup.seeks[0]).toBeCloseTo(10.12, 2);

  // Attempt 2: still stalled, nudges to 10.24
  stallSetup.listeners.get("playbackStalled")?.({});
  scheduledCallback?.();
  expect(stallSetup.seeks).toHaveLength(2);
  expect(stallSetup.seeks[1]).toBeCloseTo(10.24, 2);

  // Attempt 3: nudges to 10.36
  stallSetup.listeners.get("playbackStalled")?.({});
  scheduledCallback?.();
  expect(stallSetup.seeks).toHaveLength(3);
  expect(stallSetup.seeks[2]).toBeCloseTo(10.36, 2);

  // Attempt 4: circuit breaker trips (attempts >= 3) — no further seeks!
  stallSetup.listeners.get("playbackStalled")?.({});
  scheduledCallback?.();
  expect(stallSetup.seeks).toHaveLength(3);

  // Playback resumes -> resets state
  stallSetup.listeners.get("playbackPlaying")?.({});

  // Next stall event after playback resumed can recover again
  stallSetup.listeners.get("playbackStalled")?.({});
  scheduledCallback?.();
  expect(stallSetup.seeks).toHaveLength(4);
  expect(stallSetup.seeks[3]).toBeCloseTo(10.48, 2);

  cleanupStall();
});

test("attachDashPlaybackStallRecovery cancels timer on pause and cleans up on teardown", () => {
  let scheduledCallback: (() => void) | null = null;
  const mockSchedule = (cb: () => void) => {
    scheduledCallback = cb;
    return () => {
      scheduledCallback = null;
    };
  };

  const setup = fakeDashPlayer({ currentTime: 10 });
  attachDashPlaybackStallRecovery(setup.player, setup.library, mockSchedule);

  // Trigger stall timer
  setup.listeners.get("bufferStalled")?.({});
  expect(scheduledCallback).not.toBeNull();

  // Pause cancels timer
  setup.listeners.get("playbackPaused")?.({});
  expect(scheduledCallback).toBeNull();

  // Teardown cleans up
  setup.listeners.get("bufferStalled")?.({});
  expect(scheduledCallback).not.toBeNull();
  setup.listeners.get("streamTeardownComplete")?.({});
  expect(scheduledCallback).toBeNull();
});

test("attachDashPlaybackStallRecovery never seeks backward when stalled at edge of buffer", () => {
  let scheduledCallback: (() => void) | null = null;
  const mockSchedule = (cb: () => void) => {
    scheduledCallback = cb;
    return () => {
      scheduledCallback = null;
    };
  };

  // Buffer ends at 10.02s, video stalled at 10.0s waiting for network
  const lagSetup = fakeDashPlayer({
    currentTime: 10.0,
    buffered: {
      length: 1,
      start: () => 5,
      end: () => 10.02,
    },
  });

  const cleanup = attachDashPlaybackStallRecovery(lagSetup.player, lagSetup.library, mockSchedule);

  lagSetup.listeners.get("playbackStalled")?.({});
  expect(scheduledCallback).not.toBeNull();
  scheduledCallback?.();

  // Must NOT seek backward (should have 0 seeks!)
  expect(lagSetup.seeks).toHaveLength(0);
  cleanup();
});

test("attachDashPlaybackStallRecovery never seeks backward if currentTime moves past stall anchor", () => {
  let scheduledCallback: (() => void) | null = null;
  const mockSchedule = (cb: () => void) => {
    scheduledCallback = cb;
    return () => {
      scheduledCallback = null;
    };
  };

  // Video initially stalled at 10s within buffer [5, 20]
  const advanceSetup = fakeDashPlayer({
    currentTime: 10.0,
    buffered: {
      length: 1,
      start: () => 5,
      end: () => 20,
    },
  });

  const cleanup = attachDashPlaybackStallRecovery(
    advanceSetup.player,
    advanceSetup.library,
    mockSchedule,
  );

  advanceSetup.listeners.get("playbackStalled")?.({});
  scheduledCallback?.();
  expect(advanceSetup.seeks).toHaveLength(1);
  expect(advanceSetup.seeks[0]).toBeCloseTo(10.12, 2);

  // Playback advanced to 11.5s
  advanceSetup.state.currentTime = 11.5;
  advanceSetup.listeners.get("playbackWaiting")?.({});
  scheduledCallback?.();

  expect(advanceSetup.seeks).toHaveLength(2);
  // Must NOT seek back to 10.24, must seek forward beyond 11.5!
  expect(advanceSetup.seeks[1]).toBeGreaterThanOrEqual(11.5 + 0.12);
  cleanup();
});

test("playbackSeeked clears pending stall recovery timer", () => {
  let scheduledCallback: (() => void) | null = null;
  const mockSchedule = (cb: () => void) => {
    scheduledCallback = cb;
    return () => {
      scheduledCallback = null;
    };
  };

  const setup = fakeDashPlayer({ currentTime: 10 });
  const cleanup = attachDashPlaybackStallRecovery(setup.player, setup.library, mockSchedule);

  setup.listeners.get("playbackStalled")?.({});
  expect(scheduledCallback).not.toBeNull();

  // Seeked event fires (e.g. from user seek or player seek)
  setup.listeners.get("playbackSeeked")?.({});
  // Pending stall timer should be cleared, not re-scheduled
  expect(scheduledCallback).toBeNull();
  cleanup();
});

test("playback advancing cancels stall recovery timer and prevents false seeks", () => {
  let scheduledCallback: (() => void) | null = null;
  const mockSchedule = (cb: () => void) => {
    scheduledCallback = cb;
    return () => {
      scheduledCallback = null;
    };
  };

  const setup = fakeDashPlayer({
    currentTime: 20.0,
    buffered: {
      length: 1,
      start: () => 15,
      end: () => 30,
    },
  });
  const cleanup = attachDashPlaybackStallRecovery(setup.player, setup.library, mockSchedule);

  // Transient buffer empty event while playing
  setup.listeners.get("bufferStalled")?.({});
  expect(scheduledCallback).not.toBeNull();

  // Playback naturally advanced forward to 20.3s
  setup.state.currentTime = 20.3;
  setup.listeners.get("playbackTimeUpdated")?.({});

  // Timer should be cancelled immediately
  expect(scheduledCallback).toBeNull();
  expect(setup.seeks).toHaveLength(0);

  // If callback was somehow run, it must abort without seeking
  setup.listeners.get("playbackWaiting")?.({});
  setup.state.currentTime = 20.6;
  scheduledCallback?.();
  expect(setup.seeks).toHaveLength(0);

  cleanup();
});
