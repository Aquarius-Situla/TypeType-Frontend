import type { HlsConfig } from "hls.js";

type LatencyConfig = Pick<
  HlsConfig,
  "lowLatencyMode" | "liveSyncDuration" | "liveMaxLatencyDuration" | "maxLiveSyncPlaybackRate"
>;

// In seconds, not in segments: Twitch announces a 6 s target duration for 2 s segments, so counts of segments put
// the player three times further behind than meant. Low latency keeps two segments of margin and speeds up a little
// to catch the edge; the steady mode keeps six and never changes speed, which rides out a slow network.
export function liveLatencyConfig(lowLatency: boolean): LatencyConfig {
  return lowLatency
    ? {
        lowLatencyMode: true,
        liveSyncDuration: 4,
        liveMaxLatencyDuration: 10,
        maxLiveSyncPlaybackRate: 1.1,
      }
    : {
        lowLatencyMode: false,
        liveSyncDuration: 12,
        liveMaxLatencyDuration: 30,
        maxLiveSyncPlaybackRate: 1,
      };
}
