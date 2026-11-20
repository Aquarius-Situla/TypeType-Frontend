import { expect, test } from "bun:test";
import { createHlsConfig } from "@typetype/mse";
import { STREAMING_BUFFER_POLICY } from "../src/lib/dash-streaming-settings";
import { HLS_BUFFER_LIMITS } from "../src/lib/hls-buffer-limits";

test("the Video.js HLS buffer keeps the limits of the other player", () => {
  const config = createHlsConfig({ FetchLoader: class {}, policy: STREAMING_BUFFER_POLICY });

  expect(HLS_BUFFER_LIMITS).toEqual({
    backBufferLength: config.backBufferLength,
    maxBufferLength: config.maxBufferLength,
    maxMaxBufferLength: config.maxMaxBufferLength,
  });
  expect(HLS_BUFFER_LIMITS.backBufferLength).toBe(20);
});
