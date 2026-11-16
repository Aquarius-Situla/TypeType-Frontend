import { createDashSettings } from "@typetype/mse";
import { useBilibiliBufferStore } from "../stores/bilibili-buffer-store";
import {
  BILIBILI_LIGHT_KBPS,
  bilibiliBufferSeconds,
  bilibiliBufferSettings,
} from "./bilibili-buffer";
import { DASH_OUTAGE_RETRY } from "./playback-outage-policy";
import type { Provider } from "./provider";

// The server already races mirrors for a slow Bilibili range; abandoning it restarts the segment from zero.
// The start quality holds until playback starts: dash.js picks again on the start position seek, from
// the speed of a first segment the server often answers from memory, and that switch can leave
// Chrome seeking forever. attachBilibiliSeekBuffer lifts the cap.
const BILIBILI_ABR = {
  initialBitrate: { video: BILIBILI_LIGHT_KBPS },
  maxBitrate: { video: BILIBILI_LIGHT_KBPS },
  rules: { abandonRequestsRule: { active: false } },
} as const;

// dash.js retries at a fixed interval and then gives up on the segment for good: about 30 s of
// retries, like hls.js, lets playback resume by itself after a network cut.
export const STREAMING_BUFFER_POLICY = {
  steadyBufferMs: 36_000,
  maxBufferMs: 60_000,
  backBufferMs: 20_000,
  mediaAttempts: 20,
} as const;

export function bilibiliSteadySeconds(playbackRate = 1): number {
  return bilibiliBufferSeconds(useBilibiliBufferStore.getState().level, playbackRate);
}

export function buildDashStreamingSettings(sourceProvider?: Provider) {
  const isBilibili = sourceProvider === "bilibili";
  const bilibiliSeconds = bilibiliSteadySeconds();
  const bufferPolicy = isBilibili
    ? { ...STREAMING_BUFFER_POLICY, steadyBufferMs: bilibiliSeconds * 1000 }
    : STREAMING_BUFFER_POLICY;
  const dashSettings = createDashSettings(bufferPolicy);
  return {
    ...dashSettings,
    retryAttempts: { ...dashSettings.retryAttempts, ...DASH_OUTAGE_RETRY.retryAttempts },
    retryIntervals: { ...dashSettings.retryIntervals, ...DASH_OUTAGE_RETRY.retryIntervals },
    buffer: {
      ...dashSettings.buffer,
      ...(isBilibili
        ? { ...bilibiliBufferSettings(bilibiliSeconds), fastSwitchEnabled: false }
        : {
            bufferTimeDefault: 24,
            bufferTimeAtTopQuality: 36,
            bufferTimeAtTopQualityLongForm: 60,
          }),
    },
    ...(isBilibili ? { abr: BILIBILI_ABR } : {}),
    gaps: {
      enableStallFix: true,
    },
    cmcd: { enabled: false },
  };
}
