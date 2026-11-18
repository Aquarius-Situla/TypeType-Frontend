import { expect, test } from "bun:test";
import { watchSecondaryPanelClassName } from "../src/lib/layout-preferences";

test("recommendations use the fluid panel at both sizes", () => {
  expect(watchSecondaryPanelClassName("default", false)).toContain("watch-secondary-panel");
  expect(watchSecondaryPanelClassName("default", false)).not.toContain("-large");
  expect(watchSecondaryPanelClassName("large", false)).toContain("watch-secondary-panel-large");
});

test("an open live chat keeps its own desktop column", () => {
  const classes = watchSecondaryPanelClassName("large", true);
  expect(classes).toContain("watch-secondary-panel-chat");
  expect(classes).not.toContain("watch-secondary-panel-large");
});
