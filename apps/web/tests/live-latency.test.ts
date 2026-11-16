import { expect, test } from "bun:test";
import { liveLatencyConfig } from "../src/lib/live-latency";

test("low latency stays closer to the edge than the steady mode", () => {
  const low = liveLatencyConfig(true);
  const steady = liveLatencyConfig(false);
  expect(low.liveSyncDuration).toBeLessThan(steady.liveSyncDuration ?? 0);
  expect(low.liveMaxLatencyDuration).toBeGreaterThan(low.liveSyncDuration ?? 0);
  expect(steady.liveMaxLatencyDuration).toBeGreaterThan(steady.liveSyncDuration ?? 0);
  expect(steady.maxLiveSyncPlaybackRate).toBe(1);
});
