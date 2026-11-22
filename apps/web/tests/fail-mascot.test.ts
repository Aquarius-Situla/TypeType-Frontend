import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FailMascot } from "../src/components/fail-mascot";
import { allFailMascotPaths, FAIL_MASCOT_DIMENSIONS, failMascotSrc } from "../src/lib/fail-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

test("Tyme video-error WebP exists in public assets", () => {
  const paths = allFailMascotPaths();
  expect(paths).toEqual(["/reactions/video-error.webp"]);
  for (const src of paths) {
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
  expect(FAIL_MASCOT_DIMENSIONS).toEqual({ width: 600, height: 448 });
});

test("FailMascot renders unified transparent video-error WebP", () => {
  const html = renderToStaticMarkup(createElement(FailMascot));
  expect(html).toContain(`src="${failMascotSrc()}"`);
  expect(html).not.toContain("bg-[#fdfefe]");
});