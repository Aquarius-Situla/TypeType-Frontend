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

test("handles a pause immediately and stops the engine even when callbacks are provided", () => {
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
  let handled = 0;
  let nativePlays = 0;
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
    () => {
      handled += 1;
    },
    {
      onNativePlay: () => {
        nativePlays += 1;
      },
    },
  );

  onPause?.();

  expect(pauses).toBe(1);
  expect(handled).toBe(1);
  expect(state).toBe("ready");
  expect(nativePlays).toBe(0);
});

test("triggers native play callback when media element plays while engine was ready", () => {
  let onPlay: (() => void) | undefined;
  const video = {
    paused: false,
    addEventListener: (type: string, listener: EventListener) => {
      if (type === "play") onPlay = listener as unknown as () => void;
    },
    removeEventListener: () => {},
  } as unknown as HTMLVideoElement;
  let nativePlays = 0;
  registerSabrNativePause(
    video,
    {
      snapshot: () => ({ state: "ready" }),
      isApplyingTransientMediaState: () => false,
      pause: () => {},
    },
    { current: false },
    () => {},
    {
      onNativePlay: () => {
        nativePlays += 1;
      },
    },
  );

  onPlay?.();

  expect(nativePlays).toBe(1);
});

test("ignores a pause when pending play is waiting for autoplay confirmation", () => {
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
    undefined,
    { current: true },
    { isConfirmed: false },
  );

  onPause?.();

  expect(pauses).toBe(0);
  expect(state).toBe("playing");
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
