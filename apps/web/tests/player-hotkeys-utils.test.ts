import { expect, test } from "bun:test";
import {
  isInteractiveTarget,
  isPlaybackToggleShortcut,
  keyboardSeekOffset,
  nextKeyboardSeekTarget,
  shouldSuppressContextMenu,
} from "../src/components/player-hotkeys-utils";

test("recognizes non-HTML descendants of interactive controls", () => {
  const elementDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Element");
  const htmlDescriptor = Object.getOwnPropertyDescriptor(globalThis, "HTMLElement");
  class TestElement extends EventTarget {
    constructor(private readonly interactive: boolean) {
      super();
    }
    closest() {
      return this.interactive ? this : null;
    }
  }
  class TestHTMLElement extends TestElement {}
  Object.defineProperty(globalThis, "Element", { configurable: true, value: TestElement });
  Object.defineProperty(globalThis, "HTMLElement", { configurable: true, value: TestHTMLElement });
  try {
    expect(isInteractiveTarget(new TestElement(true))).toBe(true);
    expect(isInteractiveTarget(new TestElement(false))).toBe(false);
    expect(isInteractiveTarget(null)).toBe(false);
  } finally {
    if (elementDescriptor) Object.defineProperty(globalThis, "Element", elementDescriptor);
    else Reflect.deleteProperty(globalThis, "Element");
    if (htmlDescriptor) Object.defineProperty(globalThis, "HTMLElement", htmlDescriptor);
    else Reflect.deleteProperty(globalThis, "HTMLElement");
  }
});

test("maps horizontal arrow keys to ten second seeks", () => {
  expect(keyboardSeekOffset("ArrowLeft")).toBe(-10);
  expect(keyboardSeekOffset("ArrowRight")).toBe(10);
  expect(keyboardSeekOffset("ArrowUp")).toBeNull();
});

test("maps K to playback toggle", () => {
  expect(isPlaybackToggleShortcut("KeyK")).toBe(true);
  expect(isPlaybackToggleShortcut("Space")).toBe(false);
});

test("accumulates rapid arrow seeks from the last requested target", () => {
  const first = nextKeyboardSeekTarget(10, 120, 10, { position: 0, updatedAt: 0 }, 2_000);
  const second = nextKeyboardSeekTarget(10, 120, 10, first, 2_100);
  const third = nextKeyboardSeekTarget(20, 120, 10, second, 2_200);

  expect([first.position, second.position, third.position]).toEqual([20, 30, 40]);
  expect(nextKeyboardSeekTarget(25, 120, 10, third, 4_000).position).toBe(35);
});

test("shouldSuppressContextMenu guards player surface and active holds while sparing interactive targets", () => {
  const elementDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Element");
  class TestElement extends EventTarget {
    constructor(private readonly interactive: boolean) {
      super();
    }
    closest(selector: string) {
      return this.interactive && selector.includes("button") ? this : null;
    }
  }
  Object.defineProperty(globalThis, "Element", { configurable: true, value: TestElement });
  try {
    const interactiveTarget = new TestElement(true);
    const normalTarget = new TestElement(false);

    // Never suppresses context menu on interactive controls (buttons, links, inputs)
    expect(shouldSuppressContextMenu(interactiveTarget, true, true)).toBe(false);
    expect(shouldSuppressContextMenu(interactiveTarget, true, false)).toBe(false);
    expect(shouldSuppressContextMenu(interactiveTarget, false, true)).toBe(false);

    // Does not suppress context menu when not holding
    expect(shouldSuppressContextMenu(normalTarget, true, false)).toBe(false);

    // Does not suppress when outside player even if holding
    expect(shouldSuppressContextMenu(normalTarget, false, true)).toBe(false);
    expect(shouldSuppressContextMenu(null, false, true)).toBe(false);

    // Suppresses only when inside player AND holding / scrubbing / tap-suppressing
    expect(shouldSuppressContextMenu(normalTarget, true, true)).toBe(true);

    // Does not suppress outside player when not holding
    expect(shouldSuppressContextMenu(normalTarget, false, false)).toBe(false);
    expect(shouldSuppressContextMenu(null, false, false)).toBe(false);
  } finally {
    if (elementDescriptor) Object.defineProperty(globalThis, "Element", elementDescriptor);
    else Reflect.deleteProperty(globalThis, "Element");
  }
});
