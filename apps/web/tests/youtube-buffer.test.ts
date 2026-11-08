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
    expect(youtubeBufferSeconds("saver", 1)).toBe(6);
    expect(youtubeBufferSeconds("normal", 1)).toBe(10);
    expect(youtubeBufferSeconds("large", 1)).toBe(25);

    expect(youtubeBackBufferSeconds("saver")).toBe(3);
    expect(youtubeBackBufferSeconds("normal")).toBe(5);
    expect(youtubeBackBufferSeconds("large")).toBe(15);
  });

  it("scales forward buffer dynamically with playback rate up to 120s", () => {
    // Saver (6s baseline)
    expect(youtubeBufferSeconds("saver", 2)).toBe(12);
    expect(youtubeBufferSeconds("saver", 3)).toBe(18);

    // Normal (10s baseline)
    expect(youtubeBufferSeconds("normal", 2)).toBe(20);

    // Large (25s baseline)
    expect(youtubeBufferSeconds("large", 2)).toBe(50);
    expect(youtubeBufferSeconds("large", 4)).toBe(100);
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
