import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FocusDenyMascot } from "../src/components/focus-deny-mascot";
import {
  allFocusDenyMascotPaths,
  FOCUS_DENY_DIMENSIONS,
  focusDenyMascotSrc,
} from "../src/lib/focus-deny-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

test("Focus deny WebP exists in public assets", () => {
  const paths = allFocusDenyMascotPaths();
  expect(paths).toEqual(["/focus/focus-deny.webp"]);
  for (const src of paths) {
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
  expect(FOCUS_DENY_DIMENSIONS).toEqual({ width: 1024, height: 1024 });
});

test("FocusDenyMascot renders unified transparent WebP without theme wrapper card", () => {
  const html = renderToStaticMarkup(createElement(FocusDenyMascot));
  expect(html).toContain(`src="${focusDenyMascotSrc()}"`);
  expect(html).not.toContain("bg-[#16181f]");
  expect(html).not.toContain("bg-[#ffffff]");
});