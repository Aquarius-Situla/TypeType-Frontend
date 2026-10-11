import { describe, expect, test } from "bun:test";
import { STAIRS_BOTTOM_X, STAIRS_TOP_X } from "../src/halloween/corridor/stairs-layout";
import { TORCH_DIES_X, torchLevel } from "../src/halloween/corridor/torch-failure";

describe("torch failure", () => {
  test("happens halfway down the stairs", () => {
    const halfway = (STAIRS_TOP_X + STAIRS_BOTTOM_X) / 2;
    expect(TORCH_DIES_X).toBeGreaterThan(halfway - 300);
    expect(TORCH_DIES_X).toBeLessThan(halfway + 300);
  });

  test("cuts out at once and never comes back", () => {
    expect(torchLevel(null)).toBe(1);
    expect(torchLevel(0)).toBe(0);
  });
});
