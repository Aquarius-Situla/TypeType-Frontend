import { describe, expect, test } from "bun:test";
import { AMBIENT_LAYERS, ambientLayerRect, isAmbientLightActive } from "../src/lib/ambient-light";

const base = {
  enabled: true,
  theme: "dark" as const,
  cinemaMode: false,
  webFullscreen: false,
  audioOnly: false,
};

describe("ambient light", () => {
  test("lights the page only when enabled on the dark theme with a visible video", () => {
    expect(isAmbientLightActive(base)).toBe(true);
    expect(isAmbientLightActive({ ...base, enabled: false })).toBe(false);
    expect(isAmbientLightActive({ ...base, theme: "light" })).toBe(false);
    expect(isAmbientLightActive({ ...base, cinemaMode: true })).toBe(false);
    expect(isAmbientLightActive({ ...base, webFullscreen: true })).toBe(false);
    expect(isAmbientLightActive({ ...base, audioOnly: true })).toBe(false);
  });

  test("stacks the frame from the widest faint layer to the full player size", () => {
    const outer = ambientLayerRect(128, 72, AMBIENT_LAYERS[0].scale);
    const inner = ambientLayerRect(128, 72, AMBIENT_LAYERS[AMBIENT_LAYERS.length - 1].scale);

    expect(outer).toEqual({ x: 0, y: 0, width: 128, height: 72 });
    expect(inner.width).toBeCloseTo(128 / AMBIENT_LAYERS[0].scale);
    expect(inner.x).toBeCloseTo((128 - inner.width) / 2);
    expect(AMBIENT_LAYERS.map((layer) => layer.alpha)).toEqual(
      [...AMBIENT_LAYERS.map((layer) => layer.alpha)].sort((a, b) => a - b),
    );
  });
});
