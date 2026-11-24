import { expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";
import {
  FOCUS_QUESTION_DIMENSIONS,
  FOCUS_REST_DIMENSIONS,
  focusQuestionMascotSrc,
  focusRestMascotSrc,
} from "../src/lib/focus-mascots";

const PUBLIC = join(import.meta.dir, "..", "public");

test("focus question and localized rest WebP assets exist in public/focus", () => {
  expect(FOCUS_QUESTION_DIMENSIONS).toEqual({ width: 1024, height: 1024 });
  expect(FOCUS_REST_DIMENSIONS).toEqual({ width: 1200, height: 896 });
  expect(existsSync(join(PUBLIC, focusQuestionMascotSrc()))).toBe(true);

  for (const locale of ["en", "zh-Hans-CN", "fr", "de", "unknown"]) {
    const src = focusRestMascotSrc(locale);
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
  expect(focusRestMascotSrc("zh-Hans-CN")).toBe("/focus/focus-rest-zh-hans-cn.webp");
  expect(focusRestMascotSrc("fr")).toBe("/focus/focus-rest-fr.webp");
  expect(focusRestMascotSrc("de")).toBe("/focus/focus-rest-de.webp");
  expect(focusRestMascotSrc("es")).toBe("/focus/focus-rest-en.webp");
});
