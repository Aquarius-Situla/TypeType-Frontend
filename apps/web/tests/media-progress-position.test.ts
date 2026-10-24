import { expect, test } from "bun:test";
import {
  readMediaPositionMs,
  resolveMediaProgressPosition,
} from "../src/lib/media-progress-position";
import { registerSabrVidstackControls } from "../src/lib/sabr-vidstack-bridge";
import {
  clearSponsorBlockEndedPosition,
  finishSponsorBlockEnd,
} from "../src/lib/sponsorblock-skip";
import { evaluateProgressPersistence } from "../src/lib/watch-resume";

test("ignores player-owned transient MSE positions", () => {
  const video = {} as HTMLVideoElement;
  registerSabrVidstackControls(video, {
    play: async () => {},
    pause: () => {},
    seek: () => {},
    isApplyingTransientMediaState: () => true,
  });

  expect(resolveMediaProgressPosition(video, 0)).toBeNull();
});

test("preserves an explicit seek target during an MSE transition", () => {
  const video = {} as HTMLVideoElement;
  registerSabrVidstackControls(video, {
    play: async () => {},
    pause: () => {},
    seek: () => {},
    isApplyingTransientMediaState: () => true,
  });

  expect(resolveMediaProgressPosition(video, 0, 125_000)).toBe(125_000);
});

test("reports stable media positions normally", () => {
  expect(resolveMediaProgressPosition(null, 42_000)).toBe(42_000);
});

test("ignores positions while the media source is detached", () => {
  const video = { readyState: 0 } as HTMLVideoElement;
  expect(resolveMediaProgressPosition(video, 0)).toBeNull();
});

test("reports positions once media metadata is available", () => {
  const video = { readyState: 4, duration: 1694.3 } as HTMLVideoElement;
  expect(resolveMediaProgressPosition(video, 42_000)).toBe(42_000);
});

test("does not save the beginning of an outro skipped before the 95% cutoff", () => {
  const savedPositions: number[] = [];
  let lastSavedPositionMs = 0;
  let maxPositionSeenMs = 0;
  let reportedPositionMs = 0;
  const durationMs = 1_000_000;

  const reportFromMedia = (video: HTMLVideoElement) => {
    const resolved = resolveMediaProgressPosition(video, readMediaPositionMs(video));
    if (resolved === null) return;
    reportedPositionMs = resolved;
    maxPositionSeenMs = Math.max(maxPositionSeenMs, resolved);
  };

  const persistProgress = (reason: "pause" | "unmount") => {
    const decision = evaluateProgressPersistence({
      positionMs: reportedPositionMs,
      durationMs,
      reason,
      lastSavedPositionMs,
      maxPositionSeenMs,
    });
    if (decision.shouldSave) {
      lastSavedPositionMs = decision.positionMs;
      savedPositions.push(decision.positionMs);
    }
  };

  const video = {
    currentTime: 880,
    duration: 1000,
    readyState: 4,
    pause() {
      reportFromMedia(video);
      persistProgress("pause");
    },
    dispatchEvent(event: Event) {
      if (event.type === "ended") {
        reportFromMedia(video);
      }
      return true;
    },
  } as unknown as HTMLVideoElement;

  // Without an end skip, pausing at 880s (before the 95% cutoff) saves 880_000ms.
  expect(
    evaluateProgressPersistence({
      positionMs: 880_000,
      durationMs,
      reason: "pause",
      lastSavedPositionMs: 0,
      maxPositionSeenMs: 880_000,
    }),
  ).toEqual({
    shouldSave: true,
    positionMs: 880_000,
    keepalive: false,
    isReset: false,
    isBackwardJump: false,
  });

  // With finishSponsorBlockEnd, pause and ended report 1_000_000ms and skip saving 880_000ms.
  finishSponsorBlockEnd(video, { pause() {} }, 1000);
  persistProgress("unmount");

  expect(reportedPositionMs).toBe(1_000_000);
  expect(savedPositions).toEqual([]);

  // Clearing the ended position after replay or seek restores reading currentTime.
  clearSponsorBlockEndedPosition(video);
  expect(readMediaPositionMs(video)).toBe(880_000);
});
