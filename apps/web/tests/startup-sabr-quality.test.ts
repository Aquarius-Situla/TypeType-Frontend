import { describe, expect, test } from "bun:test";
import type { SabrQualityOption } from "../src/lib/sabr-source";
import { startupSabrItag } from "../src/lib/sabr-source";

function option(itag: number, height: number, codec: string): SabrQualityOption {
  return {
    itag,
    label: `${height}p`,
    height,
    codec,
    codecValue: "",
    mimeType: "video/mp4",
    width: height * 2,
    fps: 30,
    bitrate: height * 1000,
  } as SabrQualityOption;
}

const options = [
  option(299, 1080, "H.264"),
  option(248, 1080, "VP9"),
  option(136, 720, "H.264"),
  option(135, 480, "H.264"),
  option(244, 480, "VP9"),
  option(134, 360, "H.264"),
];

describe("startup quality", () => {
  test("a 1080p viewer starts at 480p, H.264 first", () => {
    expect(startupSabrItag(options, "1080p")).toBe(135);
  });
  test("a viewer below 480p starts at their own quality", () => {
    expect(startupSabrItag(options, "360p")).toBe(134);
  });
  test("a video without 480p starts at the next quality below", () => {
    expect(startupSabrItag([option(299, 1080, "H.264"), option(134, 360, "H.264")], "1080p")).toBe(
      134,
    );
  });
});
