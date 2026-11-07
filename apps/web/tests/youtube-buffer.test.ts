import { describe, expect, it } from "bun:test";
import {
  isYoutubeBufferLevel,
  youtubeBackBufferSeconds,
  youtubeBufferSeconds,
} from "../src/lib/youtube-buffer";
import { useYoutubeBufferStore } from "../src/stores/youtube-buffer-store";

describe("youtubeBuffer", () => {
  it("validates buffer levels correctly", () => {
    expect(isYoutubeBufferLevel("saver")).toBe(true);
    expect(isYoutubeBufferLevel("normal")).toBe(true);
    expect(isYoutubeBufferLevel("large")).toBe(true);
    expect(isYoutubeBufferLevel("ultra")).toBe(false);
    expect(isYoutubeBufferLevel(null)).toBe(false);
  });

  it("calculates baseline forward and back buffer correctly at 1x", () => {
    expect(youtubeBufferSeconds("saver", 1)).toBe(15);
    expect(youtubeBufferSeconds("normal", 1)).toBe(35);
    expect(youtubeBufferSeconds("large", 1)).toBe(60);

    expect(youtubeBackBufferSeconds("saver")).toBe(20);
    expect(youtubeBackBufferSeconds("normal")).toBe(45);
    expect(youtubeBackBufferSeconds("large")).toBe(60);
  });

  it("scales forward buffer dynamically with playback rate up to 120s", () => {
    // Saver (15s baseline)
    expect(youtubeBufferSeconds("saver", 2)).toBe(30);
    expect(youtubeBufferSeconds("saver", 3)).toBe(45);

    // Normal (35s baseline)
    expect(youtubeBufferSeconds("normal", 2)).toBe(70);

    // Large (60s baseline)
    expect(youtubeBufferSeconds("large", 2)).toBe(120);
    // Bounded by max 120 seconds
    expect(youtubeBufferSeconds("large", 3)).toBe(120);
    expect(youtubeBufferSeconds("large", 4)).toBe(120);
  });

  it("allows setting store level", () => {
    useYoutubeBufferStore.getState().setLevel("large");
    expect(useYoutubeBufferStore.getState().level).toBe("large");

    useYoutubeBufferStore.getState().setLevel("saver");
    expect(useYoutubeBufferStore.getState().level).toBe("saver");

    useYoutubeBufferStore.getState().setLevel("normal");
    expect(useYoutubeBufferStore.getState().level).toBe("normal");
  });
});
