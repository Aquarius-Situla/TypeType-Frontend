import type { HlsConfig } from "hls.js";

type LatencyConfig = Pick<
  HlsConfig,
  "lowLatencyMode" | "liveSyncDuration" | "liveMaxLatencyDuration" | "maxLiveSyncPlaybackRate"
>;

// Where low latency settles once playback runs; it starts further back (see liveLatencyConfig).
export const LOW_LATENCY_TARGET = 6;

// In seconds, not in segments: Twitch announces a 6 s target duration for 2 s segments, so counts of segments put
// the player three times further behind than meant. The live service lists Twitch's prefetch segments, so the end of
// the playlist is about 4 s ahead of the newest complete segment. Low latency starts 8 s back, with a few seconds of
// complete segments buffered, then settles at LOW_LATENCY_TARGET by playing a little faster: starting at the target
// left a single second of buffer and stalled at almost every start. The steady mode keeps eight seconds of margin
// and never changes speed.
export function liveLatencyConfig(lowLatency: boolean): LatencyConfig {
  return lowLatency
    ? {
        lowLatencyMode: true,
        liveSyncDuration: 8,
        liveMaxLatencyDuration: 14,
        maxLiveSyncPlaybackRate: 1.1,
      }
    : {
        lowLatencyMode: false,
        liveSyncDuration: 12,
        liveMaxLatencyDuration: 30,
        maxLiveSyncPlaybackRate: 1,
      };
}
