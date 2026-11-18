import { expect, test } from "bun:test";
import {
  blocksPlayerShortcut,
  isInteractiveTarget,
  isMouseClickPastTap,
  isPlaybackToggleShortcut,
  keyboardSeekOffset,
  nextKeyboardRate,
  nextKeyboardSeekTarget,
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
  expect(keyboardSeekOffset("KeyJ")).toBe(-10);
  expect(keyboardSeekOffset("KeyL")).toBe(10);
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

test("< and > step the speed by a quarter within the menu range", () => {
  expect(nextKeyboardRate(1, 0.25)).toBe(1.25);
  expect(nextKeyboardRate(1.1, -0.25)).toBe(0.85);
  expect(nextKeyboardRate(4, 0.25)).toBe(4);
  expect(nextKeyboardRate(0.25, -0.25)).toBe(0.25);
});

test("a player button keeps the shortcuts, fields and menus do not", () => {
  const elementDescriptor = Object.getOwnPropertyDescriptor(globalThis, "Element");
  const htmlDescriptor = Object.getOwnPropertyDescriptor(globalThis, "HTMLElement");
  class Node extends EventTarget {
    constructor(
      readonly tag: string,
      readonly parent: Node | null = null,
      readonly role = "",
    ) {
      super();
    }
    get isContentEditable() {
      return false;
    }
    matches(selector: string) {
      return selector.split(",").some((part) => {
        const token = part.trim();
        const role = token.match(/^\[role='(.+)'\]$/);
        if (role) return this.role === role[1];
        return token === this.tag;
      });
    }
    closest(selector: string) {
      for (let node: Node | null = this; node; node = node.parent)
        if (node.matches(selector)) return node;
      return null;
    }
    contains(other: Node) {
      for (let node: Node | null = other; node; node = node.parent) if (node === this) return true;
      return false;
    }
  }
  Object.defineProperty(globalThis, "Element", { configurable: true, value: Node });
  Object.defineProperty(globalThis, "HTMLElement", { configurable: true, value: Node });
  try {
    const page = new Node("body");
    const player = new Node("div", page);
    const settings = new Node("button", player);
    const menu = new Node("div", player, "menu");
    const row = new Node("button", menu);
    const outside = new Node("button", page);
    const field = new Node("input", page);
    const target = (node: Node) => node as unknown as EventTarget;
    const root = player as unknown as HTMLElement;
    expect(blocksPlayerShortcut(target(settings), root)).toBe(false);
    expect(blocksPlayerShortcut(target(row), root)).toBe(true);
    expect(blocksPlayerShortcut(target(outside), root)).toBe(true);
    expect(blocksPlayerShortcut(target(field), root)).toBe(true);
    expect(blocksPlayerShortcut(target(page), root)).toBe(false);
  } finally {
    if (elementDescriptor) Object.defineProperty(globalThis, "Element", elementDescriptor);
    else Reflect.deleteProperty(globalThis, "Element");
    if (htmlDescriptor) Object.defineProperty(globalThis, "HTMLElement", htmlDescriptor);
    else Reflect.deleteProperty(globalThis, "HTMLElement");
  }
});

test("a mouse click too long for the player's tap is still a click", () => {
  expect(isMouseClickPastTap("mouse", 251, 250)).toBe(true);
  expect(isMouseClickPastTap("mouse", 250, 250)).toBe(false);
  expect(isMouseClickPastTap("mouse", 400, undefined)).toBe(false);
  expect(isMouseClickPastTap("touch", 400, 250)).toBe(false);
});
