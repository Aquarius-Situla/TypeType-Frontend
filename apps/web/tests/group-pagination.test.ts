import { expect, test } from "bun:test";
import { fitGroupPage, groupPage } from "../src/lib/group-pagination";

test("replacement pages cover 150 channels exactly once, including the partial last page", () => {
  const channels = Array.from({ length: 150 }, (_, index) => index);
  for (const size of [1, 6, 8, 11, 17]) {
    const seen: number[] = [];
    const first = groupPage(channels.length, size, 0);
    for (let index = 0; index < first.pages; index++) {
      const page = groupPage(channels.length, size, index);
      seen.push(...channels.slice(page.start, page.end));
    }
    expect(seen).toEqual(channels);
  }
});

test("viewport capacity budgets the full expanded editor without losing the last selected row", () => {
  const before = groupPage(150, 8, 1);
  const editing = fitGroupPage(before, 150, 448, 56, 72, 15);
  expect(editing.size).toBe(6);
  expect(editing.start).toBeLessThanOrEqual(15);
  expect(editing.end).toBeGreaterThan(15);
  expect(editing.size * 56 + 72).toBeLessThanOrEqual(448);
  const closed = fitGroupPage(editing, 150, 448, 56, 0, 15);
  expect(closed.start).toBeLessThanOrEqual(15);
  expect(closed.end).toBeGreaterThan(15);
});

test("resizing preserves the first visible item when selection is on another page", () => {
  const before = groupPage(150, 8, 5);
  const resized = fitGroupPage(before, 150, 340, 56, 72, 2);
  expect(resized.start).toBeLessThanOrEqual(before.start);
  expect(resized.end).toBeGreaterThan(before.start);
  expect(resized.size).toBe(4);
});

test("navigating while one channel is selected does not force its page back into view", () => {
  const next = groupPage(150, 6, 3);
  expect(fitGroupPage(next, 150, 448, 56, 72, 15)).toEqual(next);
});

test("selecting a second channel keeps the clicked row visible when the editor closes", () => {
  const editing = groupPage(150, 5, 1);
  const multiple = fitGroupPage(editing, 150, 372, 56, 0, 6);
  expect(multiple.start).toBeLessThanOrEqual(6);
  expect(multiple.end).toBeGreaterThan(6);
});

test("deleting the last group on a page clamps to an available page", () => {
  const before = groupPage(19, 6, 3);
  const after = fitGroupPage(before, 18, 216, 36, 0, -1);
  expect(after).toEqual({ page: 2, size: 6, pages: 3, start: 12, end: 18 });
  expect(groupPage(0, 6, 3)).toEqual({ page: 0, size: 6, pages: 1, start: 0, end: 0 });
});

test("very short viewports and notices retain at least one usable row", () => {
  expect(fitGroupPage(groupPage(18, 6, 0), 18, 30, 56, 72, -1).size).toBe(1);
  expect(groupPage(18, 0, -1).size).toBe(1);
});
