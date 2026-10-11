import { describe, expect, test } from "bun:test";
import {
  BREATH_SECONDS,
  breathSamples,
  HEARTBEAT_SECONDS,
  heartbeatSamples,
} from "../src/halloween/synth-samples";

const peak = (samples: Float32Array): number =>
  samples.reduce((max, v) => Math.max(max, Math.abs(v)), 0);

describe("synthesized sounds", () => {
  test.each([
    ["breath", breathSamples, BREATH_SECONDS],
    ["heartbeat", heartbeatSamples, HEARTBEAT_SECONDS],
  ] as const)("%s has the right length and never clips", (_, render, seconds) => {
    const samples = render(8000);
    expect(samples.length).toBe(Math.round(8000 * seconds));
    expect(samples.every(Number.isFinite)).toBe(true);
    expect(peak(samples)).toBeGreaterThan(0.01);
    expect(peak(samples)).toBeLessThan(1);
  });
});
