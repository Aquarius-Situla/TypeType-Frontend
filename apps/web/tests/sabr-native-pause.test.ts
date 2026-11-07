import { expect, test } from "bun:test";
import { registerSabrNativePause } from "../src/lib/sabr-native-pause";

test("handles a pause before autoplay can resume the media element", () => {
  let onPause: (() => void) | undefined;
  const video = {
    paused: true,
    addEventListener: (type: string, listener: EventListener) => {
      if (type === "pause") onPause = listener as unknown as () => void;
    },
    removeEventListener: () => {},
  } as unknown as HTMLVideoElement;
  let state: "playing" | "ready" = "playing";
  let pauses = 0;
  registerSabrNativePause(
    video,
    {
      snapshot: () => ({ state }),
      isApplyingTransientMediaState: () => false,
      pause: () => {
        pauses += 1;
        state = "ready";
      },
    },
    { current: false },
    () => {},
  );

  onPause?.();
  (video as { paused: boolean }).paused = false;

  expect(pauses).toBe(1);
  expect(state).toBe("ready");
});

test("ignores a pause when the media element has ended", () => {
  let onPause: (() => void) | undefined;
  const video = {
    paused: true,
    ended: true,
    addEventListener: (type: string, listener: EventListener) => {
      if (type === "pause") onPause = listener as unknown as () => void;
    },
    removeEventListener: () => {},
  } as unknown as HTMLVideoElement;
  let state: "playing" | "ready" = "playing";
  let pauses = 0;
  registerSabrNativePause(
    video,
    {
      snapshot: () => ({ state }),
      isApplyingTransientMediaState: () => false,
      pause: () => {
        pauses += 1;
        state = "ready";
      },
    },
    { current: false },
    () => {},
  );

  onPause?.();

  expect(pauses).toBe(0);
  expect(state).toBe("playing");
});
