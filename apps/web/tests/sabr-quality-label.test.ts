import { expect, test } from "bun:test";
import { sabrQualityOptions } from "../src/lib/sabr-source";
import type { VideoStreamItem } from "../src/types/api";
import type { VideoStream } from "../src/types/stream";

test("uses the canonical quality tier for non-standard frame heights", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "MediaSource");
  Object.defineProperty(globalThis, "MediaSource", {
    configurable: true,
    value: { isTypeSupported: () => true },
  });
  const video = {
    itag: 137,
    codec: "avc1.640028",
    mimeType: "video/mp4",
    resolution: "1080p",
    width: 1920,
    height: 960,
    fps: 30,
    bitrate: 4_000_000,
    deliveryMethod: "sabr",
    sabrSessionUrl: "/api/sabr/playback/video",
  } as VideoStreamItem;
  const stream = { id: "video", videoOnlyStreams: [video] } as VideoStream;

  try {
    expect(sabrQualityOptions(stream)[0]).toMatchObject({ label: "1080p", height: 960 });
  } finally {
    if (original) Object.defineProperty(globalThis, "MediaSource", original);
    else delete (globalThis as { MediaSource?: unknown }).MediaSource;
  }
});

test("offers HDR formats only on an HDR display", () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, "MediaSource");
  Object.defineProperty(globalThis, "MediaSource", {
    configurable: true,
    value: { isTypeSupported: () => true },
  });
  const format = (itag: number, codec: string, resolution: string, bitrate: number) =>
    ({
      itag,
      codec,
      mimeType: "video/webm",
      resolution,
      width: 3840,
      height: 2160,
      fps: 60,
      bitrate,
      deliveryMethod: "sabr",
      sabrSessionUrl: "/api/sabr/playback/video",
    }) as VideoStreamItem;
  const stream = {
    id: "video",
    videoOnlyStreams: [
      format(315, "vp9", "2160p60", 26_879_488),
      format(337, "vp09.02.51.10.01.09.16.09.00", "2160p60 HDR", 29_319_624),
    ],
  } as VideoStream;

  try {
    expect(sabrQualityOptions(stream, false).map((option) => option.itag)).toEqual([315]);
    expect(sabrQualityOptions(stream, true).map((option) => option.itag)).toEqual([337]);
  } finally {
    if (original) Object.defineProperty(globalThis, "MediaSource", original);
    else delete (globalThis as { MediaSource?: unknown }).MediaSource;
  }
});
