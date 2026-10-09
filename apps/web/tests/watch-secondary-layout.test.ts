import { expect, test } from "bun:test";
import { watchSecondaryPanelClassName } from "../src/lib/layout-preferences";

test("normal video recommendations leave the flexible space to the player", () => {
  for (const size of ["default", "large"] as const) {
    const classes = watchSecondaryPanelClassName(size, false);
    expect(classes).toContain("w-full");
    expect(classes).toContain("lg:flex-none");
    expect(classes).not.toContain("lg:flex-1");
    expect(classes).not.toContain("34vw");
  }
});

test("only an open live chat receives the wider desktop column", () => {
  expect(watchSecondaryPanelClassName("large", true)).toContain("34vw");
  expect(watchSecondaryPanelClassName("large", false)).toContain("xl:w-96");
});
