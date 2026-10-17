import { expect, test } from "bun:test";
import { clearVidstackEndedState } from "../src/lib/player-ended-state";

function createMockElement(initialAttrs: Record<string, string> = {}) {
  const attrs = new Map<string, string>(Object.entries(initialAttrs));
  return {
    setAttribute(k: string, v: string) {
      attrs.set(k, v);
    },
    hasAttribute(k: string) {
      return attrs.has(k);
    },
    removeAttribute(k: string) {
      attrs.delete(k);
    },
  } as unknown as HTMLElement;
}

test("clears ended signal and removes data-ended attribute when ended is true", () => {
  let endedVal = true;
  let realTimeVal = 0;
  const el = createMockElement({ "data-ended": "true" });

  const endedSignal = () => endedVal;
  endedSignal.set = (val: boolean) => {
    endedVal = val;
  };

  const player = {
    $state: {
      ended: endedSignal,
      realCurrentTime: {
        set(val: number) {
          realTimeVal = val;
        },
      },
    },
    el,
  };

  const media = {
    currentTime: 57304.5,
  } as HTMLMediaElement;

  const result = clearVidstackEndedState(
    player as unknown as Parameters<typeof clearVidstackEndedState>[0],
    media,
  );

  expect(result).toBe(true);
  expect(endedVal).toBe(false);
  expect(realTimeVal).toBe(57304.5);
  expect(el.hasAttribute("data-ended")).toBe(false);
});

test("does not clear ended state when ended is already false", () => {
  let endedVal = false;
  const el = createMockElement();

  const endedSignal = () => endedVal;
  endedSignal.set = (val: boolean) => {
    endedVal = val;
  };

  const player = {
    $state: {
      ended: endedSignal,
    },
    el,
  };

  const media = {
    currentTime: 100,
  } as HTMLMediaElement;

  const result = clearVidstackEndedState(
    player as unknown as Parameters<typeof clearVidstackEndedState>[0],
    media,
  );

  expect(result).toBe(false);
  expect(endedVal).toBe(false);
});

test("handles null player or media gracefully", () => {
  expect(clearVidstackEndedState(null, null)).toBe(false);
  expect(clearVidstackEndedState(undefined, null)).toBe(false);
});
