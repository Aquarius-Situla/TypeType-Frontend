import { expect, test } from "bun:test";
import {
  relatedVideoPanelClassName,
  relatedVideoThumbnailClassName,
  videoGridClassName,
} from "../src/lib/layout-preferences";

test("auto and four-column grids keep the existing responsive layout", () => {
  expect(videoGridClassName(0)).toContain("lg:grid-cols-4");
  expect(videoGridClassName(4)).toContain("lg:grid-cols-4");
});

test("five and six-column grids increase the desktop density", () => {
  expect(videoGridClassName(5)).toContain("lg:grid-cols-5");
  expect(videoGridClassName(6)).toContain("xl:grid-cols-6");
});

test("large related videos use wider thumbnails and a wider panel", () => {
  expect(relatedVideoThumbnailClassName("default")).toBe("w-40 sm:w-48");
  expect(relatedVideoThumbnailClassName("large")).toBe("w-48 sm:w-56");
  expect(relatedVideoPanelClassName("default")).toBe("lg:min-w-72");
  expect(relatedVideoPanelClassName("large")).toBe("lg:min-w-96");
});
