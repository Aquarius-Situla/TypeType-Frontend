import type * as dashjs from "dashjs";
import { BILIBILI_LIGHT_KBPS, bilibiliBufferSettings } from "./bilibili-buffer";

const SEEK_BUFFER_SECONDS = 2;
const RESTORE_AFTER_SECONDS = 1.5;
const NO_BITRATE_CAP = -1;
// dash.js picks the quality of the seek segment in its own seeking handler: this one has to run first.
const BEFORE_DASH_HANDLERS = { priority: 6000 };

function updateForwardBuffer(
  player: dashjs.MediaPlayerClass,
  seconds: number,
  maxVideoKbps: number,
): void {
  player.updateSettings({
    streaming: {
      buffer: bilibiliBufferSettings(seconds),
      abr: { maxBitrate: { video: maxVideoKbps } },
    },
  });
}

// dash.js keeps the current quality when the cap changes, so the light one is asked for explicitly.
function switchToLightQuality(player: dashjs.MediaPlayerClass): void {
  const allowed = player.getRepresentationsByType("video");
  const light = allowed.reduce<dashjs.Representation | null>(
    (best, representation) =>
      !best || representation.bandwidth > best.bandwidth ? representation : best,
    null,
  );
  if (light && light.id !== player.getCurrentRepresentationForType("video")?.id) {
    player.setRepresentationForTypeById("video", light.id);
  }
}

export function attachBilibiliSeekBuffer(
  player: dashjs.MediaPlayerClass,
  steadySeconds: (playbackRate: number) => number,
): void {
  let pendingSeekTime: number | null = null;
  let started = false;
  const restore = () =>
    updateForwardBuffer(
      player,
      steadySeconds(player.getPlaybackRate()),
      started ? NO_BITRATE_CAP : BILIBILI_LIGHT_KBPS,
    );
  player.on("playbackPlaying", () => {
    if (started) return;
    started = true;
    restore();
  });
  player.on(
    "playbackSeeking",
    (event: dashjs.PlaybackSeekingEvent) => {
      // The start position seek happens while the first segment loads: switching quality then
      // abandons it, and Chrome can stay seeking forever. The start quality is light already.
      if (!started) return;
      if (event.seekTime === null || !Number.isFinite(event.seekTime)) return;
      pendingSeekTime = event.seekTime;
      updateForwardBuffer(player, SEEK_BUFFER_SECONDS, BILIBILI_LIGHT_KBPS);
      switchToLightQuality(player);
    },
    undefined,
    BEFORE_DASH_HANDLERS,
  );
  player.on("playbackRateChanged", () => {
    if (pendingSeekTime === null) restore();
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
    pendingSeekTime = null;
    restore();
  });
}
