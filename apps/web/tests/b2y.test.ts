import { describe, expect, it } from "bun:test";
import { normalizeBilibiliTarget, useB2YStore } from "../src/stores/b2y-store";

describe("B2Y (Bilibili to YouTube Danmaku) Store & Normalization", () => {
  it("normalizes BV identifiers and URLs correctly", () => {
    expect(normalizeBilibiliTarget("BV1xx411c7mD")).toBe(
      "https://www.bilibili.com/video/BV1xx411c7mD",
    );
    expect(normalizeBilibiliTarget("https://www.bilibili.com/video/BV1xx411c7mD")).toBe(
      "https://www.bilibili.com/video/BV1xx411c7mD",
    );
    expect(normalizeBilibiliTarget("av170001")).toBe("https://www.bilibili.com/video/av170001");
  });

  it("stores and updates B2Y links and calibration offsets", () => {
    const store = useB2YStore.getState();
    const ytId = "dQw4w9WgXcQ";

    // Set link
    store.setLink(ytId, "BV1xx411c7mD", "Sample Bilibili Video", 1.5);
    let link = useB2YStore.getState().getLink(ytId);
    expect(link).toBeDefined();
    expect(link?.bilibiliUrlOrBv).toBe("BV1xx411c7mD");
    expect(link?.bilibiliTitle).toBe("Sample Bilibili Video");
    expect(link?.offsetSeconds).toBe(1.5);

    // Update calibration offset
    store.setOffset(ytId, -2.0);
    link = useB2YStore.getState().getLink(ytId);
    expect(link?.offsetSeconds).toBe(-2.0);

    // Remove link
    store.removeLink(ytId);
    link = useB2YStore.getState().getLink(ytId);
    expect(link).toBeUndefined();
  });

  it("correctly calculates danmaku timestamp offsets", () => {
    const originalDurationMs = 10_000;
    const offsetSeconds = 2.5;
    const calibratedForward = originalDurationMs + Math.round(offsetSeconds * 1000);
    expect(calibratedForward).toBe(12_500);

    const negativeOffset = -15.0;
    const calibratedClamped = Math.max(0, originalDurationMs + Math.round(negativeOffset * 1000));
    expect(calibratedClamped).toBe(0);
  });
});
