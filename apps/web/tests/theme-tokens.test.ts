import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("utilities read the theme tokens, so a dark video surface can override them", () => {
  const theme = read("../src/styles/theme.css");
  expect(theme).toContain("@theme {");
  expect(theme).not.toContain("@theme inline");
});

test("the watch shell and the other video surfaces share the dark tokens", () => {
  const layout = read("../src/styles/interface-layout.css");
  expect(layout).toMatch(/\.watch-page-shell-dark,\s*\.dark-surface\s*\{[^}]*--color-app:/);
});
