import { expect, test } from "bun:test";
import { createElement } from "react";
import { preloadableLazy } from "../src/lib/preloadable-lazy";

function Loaded({ label }: { label: string }) {
  return createElement("span", null, label);
}

test("loads the module once however many times it is preloaded", async () => {
  let loads = 0;
  const component = preloadableLazy(async () => {
    loads++;
    return Loaded;
  });

  expect(await component.preload()).toBe(Loaded);
  expect(await component.preload()).toBe(Loaded);
  expect(loads).toBe(1);
});

test("keeps the lazy component after the module loads so the page is not remounted", async () => {
  const component = preloadableLazy(async () => Loaded);
  const first = component.current();

  await component.preload();

  expect(first).not.toBe(Loaded);
  expect(component.current()).toBe(first);
});

test("hands out the loaded component directly when it was preloaded first", async () => {
  const component = preloadableLazy(async () => Loaded);

  await component.preload();

  expect(component.current()).toBe(Loaded);
  expect(component.current()).toBe(Loaded);
});
