import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  allLoadingMascotPaths,
  LOADING_MASCOT_DIMENSIONS,
  loadingMascotSrc,
  videoLoadingVariant,
} from "../src/lib/loading-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

test("every Tyme loading WebP exists in public assets", () => {
  const paths = allLoadingMascotPaths();
  expect(paths).toHaveLength(3);
  for (const src of paths) {
    expect(src.endsWith(".webp")).toBe(true);
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
});

test("resolves unified transparent WebPs and dimensions for normal, watch, and shorts", () => {
  expect(loadingMascotSrc("normal")).toBe("/reactions/loading.webp");
  expect(loadingMascotSrc(videoLoadingVariant("landscape"))).toBe("/reactions/loading-watch.webp");
  expect(loadingMascotSrc(videoLoadingVariant("portrait"))).toBe("/reactions/loading-shorts.webp");
  expect(LOADING_MASCOT_DIMENSIONS.normal).toEqual({ width: 320, height: 320 });
  expect(LOADING_MASCOT_DIMENSIONS["video-landscape"]).toEqual({ width: 640, height: 480 });
  expect(LOADING_MASCOT_DIMENSIONS["video-portrait"]).toEqual({ width: 360, height: 480 });
});

test("startup screen in index.html preloads the same normal loading WebP", () => {
  const page = readFileSync(join(import.meta.dir, "..", "index.html"), "utf8");
  expect(page).toContain(`window.__appLoaderGif = "${loadingMascotSrc("normal")}"`);
  expect(page).toContain('width="160" height="160"');
});
