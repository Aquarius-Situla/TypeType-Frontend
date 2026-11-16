import type { HlsConfig } from "hls.js";

type LatencyConfig = Pick<
  HlsConfig,
  "lowLatencyMode" | "liveSyncDuration" | "liveMaxLatencyDuration" | "maxLiveSyncPlaybackRate"
>;

// In seconds, not in segments: Twitch announces a 6 s target duration for 2 s segments, so counts of segments put
// the player three times further behind than meant. The live service lists Twitch's prefetch segments, so the end of
// the playlist is about 4 s ahead of the newest complete segment: low latency keeps about one second of margin behind
// it and may stall now and then, as on Twitch, while the steady mode keeps eight and never changes speed.
export function liveLatencyConfig(lowLatency: boolean): LatencyConfig {
  return lowLatency
    ? {
        lowLatencyMode: true,
        liveSyncDuration: 5,
        liveMaxLatencyDuration: 12,
        maxLiveSyncPlaybackRate: 1.1,
      }
    : {
        lowLatencyMode: false,
        liveSyncDuration: 12,
        liveMaxLatencyDuration: 30,
        maxLiveSyncPlaybackRate: 1,
      };
}
