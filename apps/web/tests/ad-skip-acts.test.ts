import { expect, test } from "bun:test";
import { pickSkipVariant, skipVariants } from "../src/lib/ad-skip-acts";

test("the skip button has ten acts", () => {
  expect(skipVariants()).toHaveLength(10);
  expect(new Set(skipVariants()).size).toBe(10);
  expect(skipVariants()).toContain("runner");
});

test("two ads in a row never get the same act", () => {
  let before = pickSkipVariant();
  for (let draw = 0; draw < 200; draw += 1) {
    const next = pickSkipVariant();
    expect(next).not.toBe(before);
    before = next;
  }
});

test("every act comes up", () => {
  const seen = new Set<string>();
  for (let draw = 0; draw < 600; draw += 1) seen.add(pickSkipVariant());
  expect(seen.size).toBe(10);
});

test("the draw follows the random source", () => {
  pickSkipVariant(() => 0);
  const others = skipVariants().filter((variant) => variant !== "runner");
  expect(pickSkipVariant(() => 0.999)).toBe(others[others.length - 1] ?? "runner");
});
