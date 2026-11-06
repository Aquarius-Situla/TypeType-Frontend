import { expect, test } from "bun:test";
import {
  clampPlayerVolume,
  matchesPlayerVolume,
  nextVolumeRestoreStep,
} from "../src/lib/player-volume-state";

test("clamps invalid and out-of-range volume values", () => {
  expect(clampPlayerVolume(-1)).toBe(0);
  expect(clampPlayerVolume(2)).toBe(1);
  expect(clampPlayerVolume(Number.NaN)).toBe(1);
});

test("matches volume state with media precision tolerance", () => {
  expect(matchesPlayerVolume({ volume: 0.4004, muted: false }, { volume: 0.4, muted: false })).toBe(
    true,
  );
  expect(matchesPlayerVolume({ volume: 0.41, muted: false }, { volume: 0.4, muted: false })).toBe(
    false,
  );
  expect(matchesPlayerVolume({ volume: 0.4, muted: true }, { volume: 0.4, muted: false })).toBe(
    false,
  );
});

test("restores the settings volume once when a video starts", () => {
  const playing = { volume: 1, muted: false };
  expect(nextVolumeRestoreStep(false, playing, { volume: 0.2, muted: false })).toBe("restore");
  expect(nextVolumeRestoreStep(false, playing, { volume: 1, muted: false })).toBe("matched");
});

test("keeps the playing volume when the settings change mid-video", () => {
  const playing = { volume: 0.2, muted: false };
  expect(nextVolumeRestoreStep(true, playing, { volume: 1, muted: false })).toBe("adopt");
  expect(nextVolumeRestoreStep(true, playing, { volume: 0.2, muted: true })).toBe("adopt");
  expect(nextVolumeRestoreStep(true, playing, { volume: 0.2, muted: false })).toBe("keep");
});
