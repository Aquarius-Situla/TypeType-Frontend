import { describe, expect, it } from "bun:test";
import { isNiconicoBufferLevel, niconicoBufferSeconds } from "../src/lib/niconico-buffer";
import { useNiconicoBufferStore } from "../src/stores/niconico-buffer-store";

describe("niconicoBuffer", () => {
  it("validates buffer levels correctly", () => {
    expect(isNiconicoBufferLevel("saver")).toBe(true);
    expect(isNiconicoBufferLevel("normal")).toBe(true);
    expect(isNiconicoBufferLevel("large")).toBe(true);
    expect(isNiconicoBufferLevel("turbo")).toBe(false);
    expect(isNiconicoBufferLevel(undefined)).toBe(false);
  });

  it("calculates baseline buffer correctly at 1x", () => {
    expect(niconicoBufferSeconds("saver", 1)).toBe(15);
    expect(niconicoBufferSeconds("normal", 1)).toBe(30);
    expect(niconicoBufferSeconds("large", 1)).toBe(60);
  });

  it("scales buffer dynamically with playback rate up to 120s", () => {
    // Saver (15s baseline)
    expect(niconicoBufferSeconds("saver", 2)).toBe(30);
    expect(niconicoBufferSeconds("saver", 4)).toBe(60);

    // Normal (30s baseline)
    expect(niconicoBufferSeconds("normal", 2)).toBe(60);
    expect(niconicoBufferSeconds("normal", 3)).toBe(90);

    // Large (60s baseline)
    expect(niconicoBufferSeconds("large", 2)).toBe(120);
    // Bounded by max 120 seconds
    expect(niconicoBufferSeconds("large", 3)).toBe(120);
  });

  it("allows setting store level", () => {
    useNiconicoBufferStore.getState().setLevel("large");
    expect(useNiconicoBufferStore.getState().level).toBe("large");

    useNiconicoBufferStore.getState().setLevel("saver");
    expect(useNiconicoBufferStore.getState().level).toBe("saver");

    useNiconicoBufferStore.getState().setLevel("normal");
    expect(useNiconicoBufferStore.getState().level).toBe("normal");
  });
});
