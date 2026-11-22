import { expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

test("utilities read the theme tokens, so a dark video surface can override them", () => {
  const theme = read("../src/styles/theme.css");
  expect(theme).toContain("@theme {");
  expect(theme).not.toContain("@theme inline");
});

test("video surfaces always share the dark tokens, the watch shell only in the dark theme", () => {
  const layout = read("../src/styles/interface-layout.css");
  expect(layout).toMatch(
    /:root:not\(\[data-theme="light"\]\) \.watch-page-shell-dark,\s*\.dark-surface\s*\{[^}]*--color-app:/,
  );
});

test("video surfaces set the dark zinc scale back, so the ambient light glass stays dark in the light theme", () => {
  const theme = read("../src/styles/theme.css");
  const layout = read("../src/styles/interface-layout.css");
  const block =
    layout.match(
      /:root:not\(\[data-theme="light"\]\) \.watch-page-shell-dark,\s*\.dark-surface\s*\{([^}]*)\}/,
    )?.[1] ?? "";
  const light = theme.match(/\[data-theme="light"\]\s*\{([^}]*)\}/)?.[1] ?? "";
  for (const shade of [
    "50",
    "100",
    "200",
    "300",
    "400",
    "500",
    "600",
    "700",
    "800",
    "900",
    "950",
  ]) {
    const inverted = light.match(new RegExp(`--color-zinc-${shade}:\\s*([^;]+);`))?.[1];
    expect(inverted).toBeDefined();
    expect(block).toMatch(new RegExp(`--color-zinc-${shade}:\\s*[^;]+;`));
  }
  expect(block).toContain("--color-zinc-950: oklch(14.1%");
  expect(block).toContain("--color-zinc-50: oklch(98.5%");
});

test("the page behind the ambient light follows the theme on the watch page", () => {
  const ambient = read("../src/styles/ambient-light.css");
  expect(ambient).not.toContain(":has(.watch-page-shell-dark)");
});
