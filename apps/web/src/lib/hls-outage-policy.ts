import type { HlsConfig, LoaderConfig } from "hls.js";

// hls.js retries a failed playlist twice (after 1 s then 2 s) before moving to the next quality, so a server or
// proxy restart of a few seconds exhausts every quality and playback stops for good once the buffer runs out.
// Retrying with a delay capped at 4 s rides out about a minute of outage on each quality before giving up.
const outageRetry = { maxNumRetry: 12, retryDelayMs: 1000, maxRetryDelayMs: 4000 };

const playlistPolicy: LoaderConfig = {
  maxTimeToFirstByteMs: 10_000,
  maxLoadTimeMs: 20_000,
  timeoutRetry: { maxNumRetry: 2, retryDelayMs: 0, maxRetryDelayMs: 0 },
  errorRetry: outageRetry,
};

const fragmentPolicy: LoaderConfig = {
  maxTimeToFirstByteMs: 10_000,
  maxLoadTimeMs: 120_000,
  timeoutRetry: { maxNumRetry: 4, retryDelayMs: 0, maxRetryDelayMs: 0 },
  errorRetry: outageRetry,
};

export const HLS_OUTAGE_LOAD_POLICIES: Pick<HlsConfig, "playlistLoadPolicy" | "fragLoadPolicy"> = {
  playlistLoadPolicy: { default: playlistPolicy },
  fragLoadPolicy: { default: fragmentPolicy },
};
