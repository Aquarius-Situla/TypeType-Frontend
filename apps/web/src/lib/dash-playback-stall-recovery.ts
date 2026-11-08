import type * as dashjs from "dashjs";
import { recordClientEvent } from "./client-debug-log";

const STALL_RECOVERY_DELAY_MS = 1200;
const MAX_RECOVERY_ATTEMPTS = 3;
const BUFFER_KEYFRAME_NUDGE_SECONDS = 0.12;
const BUFFER_GAP_JUMP_LEEWAY_SECONDS = 0.02;
const MAX_GAP_JUMP_SECONDS = 1.5;

export type TimeRange = {
  start: number;
  end: number;
};

export function findNextBufferedGap(
  ranges: readonly TimeRange[],
  currentTime: number,
  maxGapSeconds = MAX_GAP_JUMP_SECONDS,
): number | null {
  const currentRange = ranges.find((r) => currentTime >= r.start && currentTime < r.end);
  if (currentRange) {
    const remaining = currentRange.end - currentTime;
    if (remaining > 0.1) {
      return null;
    }
  }

  for (const range of ranges) {
    if (range.start > currentTime && range.start - currentTime <= maxGapSeconds) {
      return range.start + BUFFER_GAP_JUMP_LEEWAY_SECONDS;
    }
  }
  return null;
}

export function findBufferedNudge(
  ranges: readonly TimeRange[],
  currentTime: number,
  attempts = 1,
  stallAnchorTime: number | null = null,
): number | null {
  const currentRange = ranges.find((r) => currentTime >= r.start && currentTime < r.end);
  if (!currentRange || currentRange.end - currentTime <= 0.05) {
    return null;
  }

  const baseAnchor = stallAnchorTime ?? currentTime;
  const maxNudge = currentRange.end - BUFFER_GAP_JUMP_LEEWAY_SECONDS;
  const nudgeTarget = Math.min(
    Math.max(
      baseAnchor + BUFFER_KEYFRAME_NUDGE_SECONDS * attempts,
      currentTime + BUFFER_KEYFRAME_NUDGE_SECONDS,
    ),
    maxNudge,
  );

  if (nudgeTarget > currentTime + BUFFER_GAP_JUMP_LEEWAY_SECONDS) {
    return nudgeTarget;
  }
  return null;
}

export function readMediaTimeRanges(
  buffered:
    | {
        length: number;
        start(index: number): number;
        end(index: number): number;
      }
    | null
    | undefined,
): TimeRange[] {
  if (!buffered || buffered.length === 0) return [];
  const ranges: TimeRange[] = [];
  for (let i = 0; i < buffered.length; i++) {
    ranges.push({ start: buffered.start(i), end: buffered.end(i) });
  }
  return ranges;
}

export function attachDashPlaybackStallRecovery(
  player: dashjs.MediaPlayerClass,
  library: typeof dashjs,
  schedule = (cb: () => void, ms: number) => {
    const timer = setTimeout(cb, ms);
    return () => clearTimeout(timer);
  },
): () => void {
  let cancelTimer: (() => void) | null = null;
  let stallAnchorTime: number | null = null;
  let attempts = 0;

  const clearTimer = () => {
    cancelTimer?.();
    cancelTimer = null;
  };

  const attemptRecovery = () => {
    cancelTimer = null;
    let video: HTMLVideoElement | null = null;
    try {
      video = player.getVideoElement();
    } catch {
      cleanup();
      return;
    }
    if (!video || video.paused || video.ended || video.seeking) {
      return;
    }

    const currentTime = video.currentTime;
    const ranges = readMediaTimeRanges(video.buffered);
    if (ranges.length === 0) return;

    if (stallAnchorTime === null || Math.abs(currentTime - stallAnchorTime) > 2.0) {
      stallAnchorTime = currentTime;
      attempts = 0;
    }

    if (attempts >= MAX_RECOVERY_ATTEMPTS) {
      recordClientEvent("playback.dash_stall_max_attempts", {
        currentTimeMs: Math.round(currentTime * 1000),
        stallAnchorTimeMs: Math.round(stallAnchorTime * 1000),
        attempts,
      });
      return;
    }

    attempts += 1;

    const gapTarget = findNextBufferedGap(ranges, currentTime);
    if (gapTarget !== null) {
      recordClientEvent("playback.dash_stall_jump_gap", {
        currentTimeMs: Math.round(currentTime * 1000),
        targetMs: Math.round(gapTarget * 1000),
        attempts,
      });
      player.seek(gapTarget);
      return;
    }

    const candidateTarget =
      (stallAnchorTime ?? currentTime) + BUFFER_KEYFRAME_NUDGE_SECONDS * attempts;
    if (candidateTarget <= currentTime + BUFFER_GAP_JUMP_LEEWAY_SECONDS) {
      stallAnchorTime = currentTime;
    }

    const nudgeTarget = findBufferedNudge(ranges, currentTime, attempts, stallAnchorTime);
    if (nudgeTarget !== null) {
      recordClientEvent("playback.dash_stall_nudge", {
        currentTimeMs: Math.round(currentTime * 1000),
        targetMs: Math.round(nudgeTarget * 1000),
        attempts,
      });
      player.seek(nudgeTarget);
      return;
    }

    video.play?.().catch(() => undefined);
  };

  const scheduleRecovery = () => {
    clearTimer();
    let video: HTMLVideoElement | null = null;
    try {
      video = player.getVideoElement();
    } catch {
      return;
    }
    if (!video || video.paused || video.ended || video.seeking) return;
    cancelTimer = schedule(attemptRecovery, STALL_RECOVERY_DELAY_MS);
  };

  const onPlaying = () => {
    clearTimer();
    attempts = 0;
    stallAnchorTime = null;
  };

  const onPaused = () => {
    clearTimer();
  };

  const onSeeked = () => {
    clearTimer();
    attempts = 0;
    stallAnchorTime = null;
  };

  const onStallEvent = () => {
    scheduleRecovery();
  };

  const events = library.MediaPlayer.events;
  player.on(events.PLAYBACK_PLAYING, onPlaying);
  player.on(events.PLAYBACK_PAUSED, onPaused);
  player.on(events.PLAYBACK_ENDED, onPaused);
  player.on(events.PLAYBACK_SEEKED, onSeeked);
  player.on(events.PLAYBACK_WAITING, onStallEvent);
  player.on(events.PLAYBACK_STALLED, onStallEvent);
  player.on(events.BUFFER_EMPTY, onStallEvent);

  const cleanup = () => {
    clearTimer();
    attempts = 0;
    stallAnchorTime = null;
    player.off(events.PLAYBACK_PLAYING, onPlaying);
    player.off(events.PLAYBACK_PAUSED, onPaused);
    player.off(events.PLAYBACK_ENDED, onPaused);
    player.off(events.PLAYBACK_SEEKED, onSeeked);
    player.off(events.PLAYBACK_WAITING, onStallEvent);
    player.off(events.PLAYBACK_STALLED, onStallEvent);
    player.off(events.BUFFER_EMPTY, onStallEvent);
    if ("STREAM_TEARDOWN_COMPLETE" in events) {
      player.off(events.STREAM_TEARDOWN_COMPLETE, cleanup);
    }
  };

  if ("STREAM_TEARDOWN_COMPLETE" in events) {
    player.on(events.STREAM_TEARDOWN_COMPLETE, cleanup);
  }

  return cleanup;
}
