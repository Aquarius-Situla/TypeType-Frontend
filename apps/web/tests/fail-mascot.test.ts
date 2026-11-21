import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FailMascot } from "../src/components/fail-mascot";
import { allFailMascotPaths, failMascotSrc } from "../src/lib/fail-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

test("every Tyme fail GIF exists in public assets", () => {
  const paths = allFailMascotPaths();
  expect(paths).toHaveLength(2);
  for (const src of paths) {
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
});

test("resolves theme-specific fail GIFs", () => {
  expect(failMascotSrc("dark")).toBe("/fail/fail-dark.gif");
  expect(failMascotSrc("light")).toBe("/fail/fail-light.gif");
});

test("renders FailMascot for both dark and light themes", () => {
  expect(renderToStaticMarkup(createElement(FailMascot, { theme: "dark" }))).toContain(
    'src="/fail/fail-dark.gif"',
  );
  expect(renderToStaticMarkup(createElement(FailMascot, { theme: "light" }))).toContain(
    'src="/fail/fail-light.gif"',
  );
});
