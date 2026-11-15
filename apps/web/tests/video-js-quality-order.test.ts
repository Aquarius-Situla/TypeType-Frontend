import { expect, test } from "bun:test";
import type { MediaVideoRendition, QualityOption } from "@videojs/react";
import { qualityOptionsBestFirst } from "../src/lib/video-js-quality-order";

const option = (value: string): QualityOption => ({ value, label: value, disabled: false });
const rendition = (id: string, height: number, frameRate?: number): MediaVideoRendition => ({
  id,
  width: Math.round((height * 16) / 9),
  height,
  frameRate,
  selected: false,
});

test("keeps auto first and lists the best quality right after it", () => {
  const ordered = qualityOptionsBestFirst(
    [option("auto"), option("0"), option("1"), option("2"), option("3")],
    [rendition("0", 160), rendition("1", 480), rendition("2", 720, 30), rendition("3", 1080, 60)],
  );
  expect(ordered.map((entry) => entry.value)).toEqual(["auto", "3", "2", "1", "0"]);
});

test("ranks the higher frame rate first at the same size", () => {
  const ordered = qualityOptionsBestFirst(
    [option("auto"), option("a"), option("b")],
    [rendition("a", 720, 30), rendition("b", 720, 60)],
  );
  expect(ordered.map((entry) => entry.value)).toEqual(["auto", "b", "a"]);
});
