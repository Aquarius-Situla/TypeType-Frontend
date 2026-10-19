import { expect, test } from "bun:test";
import { resolveMediaProgressPosition } from "../src/lib/media-progress-position";
import { registerSabrVidstackControls } from "../src/lib/sabr-vidstack-bridge";

test("ignores player-owned transient MSE positions", () => {
  const video = {} as HTMLVideoElement;
  registerSabrVidstackControls(video, {
    play: async () => {},
    pause: () => {},
    seek: () => {},
    isApplyingTransientMediaState: () => true,
  });

  expect(resolveMediaProgressPosition(video, 0)).toBeNull();
});

test("preserves an explicit seek target during an MSE transition", () => {
  const video = {} as HTMLVideoElement;
  registerSabrVidstackControls(video, {
    play: async () => {},
    pause: () => {},
    seek: () => {},
    isApplyingTransientMediaState: () => true,
  });

  expect(resolveMediaProgressPosition(video, 0, 125_000)).toBe(125_000);
});

test("reports stable media positions normally", () => {
  expect(resolveMediaProgressPosition(null, 42_000)).toBe(42_000);
});

test("ignores positions while the media source is detached", () => {
  const video = { readyState: 0 } as HTMLVideoElement;
  expect(resolveMediaProgressPosition(video, 0)).toBeNull();
});

test("reports positions once media metadata is available", () => {
  const video = { readyState: 4, duration: 1694.3 } as HTMLVideoElement;
  expect(resolveMediaProgressPosition(video, 42_000)).toBe(42_000);
});
