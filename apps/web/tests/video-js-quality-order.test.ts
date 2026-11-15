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

test("falls back to the bitrate when a rendition has no size, so the source stays on top", () => {
  const source: MediaVideoRendition = { id: "s", bitrate: 8_000_000, selected: false };
  const ordered = qualityOptionsBestFirst(
    [option("auto"), option("low"), option("s"), option("mid")],
    [
      { ...rendition("low", 160), bitrate: 250_000 },
      source,
      { ...rendition("mid", 720), bitrate: 3_500_000 },
    ],
  );
  expect(ordered.map((entry) => entry.value)).toEqual(["auto", "s", "mid", "low"]);
});
