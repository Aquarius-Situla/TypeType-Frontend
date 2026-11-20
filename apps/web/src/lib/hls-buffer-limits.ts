import { STREAMING_BUFFER_POLICY } from "./dash-streaming-settings";

// hls.js keeps every played segment by default: on a long video that alone fills the memory WebKit allows a tab.
export const HLS_BUFFER_LIMITS = {
  backBufferLength: STREAMING_BUFFER_POLICY.backBufferMs / 1000,
  maxBufferLength: STREAMING_BUFFER_POLICY.steadyBufferMs / 1000,
  maxMaxBufferLength: STREAMING_BUFFER_POLICY.maxBufferMs / 1000,
} as const;
