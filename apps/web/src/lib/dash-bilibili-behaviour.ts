import type * as dashjs from "dashjs";
import { attachBilibiliSeekBuffer } from "./dash-bilibili-seek-buffer";
import { attachDashPlaybackDiagnostics } from "./dash-playback-diagnostics";
import { attachDashPlaybackStallRecovery } from "./dash-playback-stall-recovery";
import { bilibiliSteadySeconds } from "./dash-streaming-settings";

type DashRuntimeModule = typeof dashjs & { default?: typeof dashjs };

const attached = new WeakSet<dashjs.MediaPlayerClass>();

// The Bilibili seek buffer, stall recovery and diagnostics the Vidstack player attaches, for a dash.js player the
// Video.js DASH adapter created.
export function attachBilibiliDash(player: dashjs.MediaPlayerClass): void {
  if (attached.has(player)) return;
  attached.add(player);
  void import("dashjs").then((module) => {
    const library = (module as DashRuntimeModule).default ?? module;
    attachDashPlaybackDiagnostics(player, library);
    attachBilibiliSeekBuffer(player, bilibiliSteadySeconds);
    attachDashPlaybackStallRecovery(player, library);
  });
}
