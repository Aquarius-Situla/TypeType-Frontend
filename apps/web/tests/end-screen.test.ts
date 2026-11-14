import { expect, test } from "bun:test";
import { endScreenBox, visibleEndScreenElements } from "../src/lib/end-screen";
import type { EndScreenItem } from "../src/types/api";

function element(patch: Partial<EndScreenItem> = {}): EndScreenItem {
  return {
    id: "a",
    type: "video",
    title: "Next",
    url: "https://www.youtube.com/watch?v=x",
    thumbnailUrl: "",
    startMs: 590_000,
    endMs: 610_000,
    left: 0.654,
    top: 0.13,
    width: 0.322,
    aspectRatio: 16 / 9,
    ...patch,
  };
}

test("shows an element only between its start and end", () => {
  const elements = [element(), element({ id: "b", startMs: 600_000 })];

  expect(visibleEndScreenElements(elements, 589_999)).toEqual([]);
  expect(visibleEndScreenElements(elements, 590_000).map((item) => item.id)).toEqual(["a"]);
  expect(visibleEndScreenElements(elements, 605_000).map((item) => item.id)).toEqual(["a", "b"]);
  expect(visibleEndScreenElements(elements, 610_000)).toEqual([]);
});

test("sizes a 16:9 card and a square avatar from the frame width", () => {
  const card = endScreenBox(element(), 16 / 9);
  expect(card.left).toBeCloseTo(65.4);
  expect(card.width).toBeCloseTo(32.2);
  expect(card.height).toBeCloseTo(32.2);

  const avatar = endScreenBox(element({ left: 0.02, width: 0.154, aspectRatio: 1 }), 16 / 9);
  expect(avatar.height).toBeCloseTo(15.4 * (16 / 9));
});

test("keeps an oversized element inside the frame", () => {
  const box = endScreenBox(element({ left: 0.9, top: 0.9, width: 0.5 }), 16 / 9);

  expect(box.left + box.width).toBeLessThanOrEqual(100);
  expect(box.top + box.height).toBeLessThanOrEqual(100);
});
