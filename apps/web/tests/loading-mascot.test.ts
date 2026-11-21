import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  allLoadingMascotPaths,
  loadingMascotSrc,
  videoLoadingVariant,
} from "../src/lib/loading-mascot";

const PUBLIC = join(import.meta.dir, "..", "public");

test("every Tyme loading GIF exists in public assets", () => {
  const paths = allLoadingMascotPaths();
  expect(paths).toHaveLength(6);
  for (const src of paths) {
    expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
});

test("resolves theme-specific GIFs for normal, landscape video, and portrait video", () => {
  expect(loadingMascotSrc("normal", "dark")).toBe("/loading/normal/loading-dark.gif");
  expect(loadingMascotSrc("normal", "light")).toBe("/loading/normal/loading-light.gif");
  expect(loadingMascotSrc(videoLoadingVariant("landscape"), "dark")).toBe(
    "/loading/video/loading-dark.gif",
  );
  expect(loadingMascotSrc(videoLoadingVariant("landscape"), "light")).toBe(
    "/loading/video/loading-light.gif",
  );
  expect(loadingMascotSrc(videoLoadingVariant("portrait"), "dark")).toBe(
    "/loading/video/loading-vertical-dark.gif",
  );
  expect(loadingMascotSrc(videoLoadingVariant("portrait"), "light")).toBe(
    "/loading/video/loading-vertical-light.gif",
  );
});

test("startup screen in index.html preloads the same normal loading GIFs", () => {
  const page = readFileSync(join(import.meta.dir, "..", "index.html"), "utf8");
  expect(page).toContain(`dark: "${loadingMascotSrc("normal", "dark")}"`);
  expect(page).toContain(`light: "${loadingMascotSrc("normal", "light")}"`);
});
