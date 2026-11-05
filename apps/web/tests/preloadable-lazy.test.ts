import { expect, test } from "bun:test";
import { preloadableLazy } from "../src/lib/preloadable-lazy";

function View() {
  return null;
}

test("keeps the lazy component after the module loads so the page is not remounted", async () => {
  const component = preloadableLazy(() => Promise.resolve(View));
  const first = component.current();
  await component.preload();
  expect(first).not.toBe(View);
  expect(component.current()).toBe(first);
});

test("renders the loaded component directly when it was preloaded first", async () => {
  const component = preloadableLazy(() => Promise.resolve(View));
  await component.preload();
  expect(component.current()).toBe(View);
  expect(component.current()).toBe(View);
});
