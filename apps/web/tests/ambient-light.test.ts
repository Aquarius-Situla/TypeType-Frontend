import { describe, expect, test } from "bun:test";
import { AMBIENT_LAYER_COUNT, ambientLayers, isAmbientLightActive } from "../src/lib/ambient-light";

const base = { enabled: true, cinemaMode: false, webFullscreen: false, audioOnly: false };

describe("ambient light", () => {
  test("lights the watch page only when enabled with a visible video", () => {
    expect(isAmbientLightActive(base)).toBe(true);
    expect(isAmbientLightActive({ ...base, enabled: false })).toBe(false);
    expect(isAmbientLightActive({ ...base, cinemaMode: true })).toBe(false);
    expect(isAmbientLightActive({ ...base, webFullscreen: true })).toBe(false);
    expect(isAmbientLightActive({ ...base, audioOnly: true })).toBe(false);
  });

  test("stretches the frame from the screen edges down to the player", () => {
    const player = { x: 10, y: 8, width: 100, height: 56 };
    const screen = { x: 0, y: 0, width: 160, height: 90 };
    const layers = ambientLayers(player, screen);

    expect(layers).toHaveLength(AMBIENT_LAYER_COUNT);
    expect(layers[0]).toMatchObject({ ...screen, alpha: 0.35 });
    expect(layers[layers.length - 1]).toMatchObject({ ...player, alpha: 1 });
    for (let index = 1; index < layers.length; index += 1) {
      expect(layers[index].width).toBeLessThan(layers[index - 1].width);
      expect(layers[index].alpha).toBeGreaterThan(layers[index - 1].alpha);
    }
  });
});
