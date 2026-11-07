import { expect, test } from "bun:test";
import { refreshedAutoplayTarget } from "../src/lib/autoplay-target-refresh";

const target = (title = "Next") => ({ id: "next", title, search: { v: "next", list: "list" } });

test("keeps the shown target while a rebuilt next target has the same content", () => {
  const shown = target();
  expect(refreshedAutoplayTarget(shown, target())).toBe(shown);
});

test("takes the next target when its details change", () => {
  const updated = target("Next, loaded");
  expect(refreshedAutoplayTarget(target(), updated)).toBe(updated);
});

test("clears the countdown when nothing is shown or the next video changes", () => {
  expect(refreshedAutoplayTarget(null, target())).toBeNull();
  expect(refreshedAutoplayTarget(target(), null)).toBeNull();
  expect(refreshedAutoplayTarget(target(), { ...target(), id: "other" })).toBeNull();
});
