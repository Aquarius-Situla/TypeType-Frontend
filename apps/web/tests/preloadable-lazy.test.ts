import { expect, test } from "bun:test";
import { createElement } from "react";
import { preloadableLazy } from "../src/lib/preloadable-lazy";

function Loaded({ label }: { label: string }) {
  return createElement("span", null, label);
}

test("hands out the loaded component directly once it has been preloaded", async () => {
  let loads = 0;
  const component = preloadableLazy(async () => {
    loads++;
    return Loaded;
  });

  expect(component.current()).not.toBe(Loaded);

  expect(await component.preload()).toBe(Loaded);
  expect(await component.preload()).toBe(Loaded);
  expect(loads).toBe(1);
  expect(component.current()).toBe(Loaded);
});
