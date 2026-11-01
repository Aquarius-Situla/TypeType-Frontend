import type * as dashjs from "dashjs";
import { bilibiliBufferSettings } from "./bilibili-buffer";

const SEEK_BUFFER_SECONDS = 2;
const RESTORE_AFTER_SECONDS = 1.5;

function updateForwardBuffer(player: dashjs.MediaPlayerClass, seconds: number): void {
  player.updateSettings({ streaming: { buffer: bilibiliBufferSettings(seconds) } });
}

export function attachBilibiliSeekBuffer(
  player: dashjs.MediaPlayerClass,
  steadySeconds: (playbackRate: number) => number,
): void {
  let pendingSeekTime: number | null = null;
  const restore = () => {
    pendingSeekTime = null;
    updateForwardBuffer(player, steadySeconds(player.getPlaybackRate()));
  };
  player.on("playbackSeeking", (event: dashjs.PlaybackSeekingEvent) => {
    if (event.seekTime === null || !Number.isFinite(event.seekTime)) return;
    pendingSeekTime = event.seekTime;
    updateForwardBuffer(player, SEEK_BUFFER_SECONDS);
  });
  player.on("playbackRateChanged", () => {
    if (pendingSeekTime === null) restore();
  });
  player.on("playbackPlaying", () => {
    if (pendingSeekTime !== null) restore();
  });
  player.on("playbackSeeked", () => {
    if (pendingSeekTime !== null && !player.isPaused()) restore();
  });
  player.on("playbackTimeUpdated", (event: dashjs.PlaybackTimeUpdatedEvent) => {
    if (
      pendingSeekTime === null ||
      event.time === null ||
      !Number.isFinite(event.time) ||
      player.isPaused() ||
      player.isSeeking() ||
      event.time < pendingSeekTime + RESTORE_AFTER_SECONDS
    )
      return;
    restore();
  });
}
