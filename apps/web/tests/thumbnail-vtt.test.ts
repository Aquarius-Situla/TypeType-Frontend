import { expect, test } from "bun:test";
import { buildThumbnailVtt } from "../src/lib/thumbnail-vtt";
import type { PreviewFrameItem } from "../src/types/api";

test("buildThumbnailVtt creates valid JSON cues and extends last cue to duration", async () => {
  const frames: PreviewFrameItem[] = [
    {
      urls: ["https://example.com/sheet1.jpg"],
      frameWidth: 160,
      frameHeight: 90,
      framesPerPageX: 2,
      framesPerPageY: 2,
      durationPerFrame: 10000, // 10s per frame, 4 frames = 40s
    },
  ];

  // Mock URL.createObjectURL and Blob if running in bun test environment
  let createdBlob: Blob | null = null;
  const originalCreateObjectURL = URL.createObjectURL;
  URL.createObjectURL = (blob: Blob) => {
    createdBlob = blob;
    return "blob:test";
  };

  try {
    const url = buildThumbnailVtt(frames, 3600); // video duration 3600s
    expect(url).toBe("blob:test");
    expect(createdBlob).not.toBeNull();
    const blob = createdBlob as Blob;
    expect(blob.type).toContain("application/json");

    const text = await blob.text();
    const cues = JSON.parse(text);

    expect(cues).toHaveLength(4);
    expect(cues[0]).toEqual({
      startTime: 0,
      endTime: 10,
      text: "https://example.com/sheet1.jpg#xywh=0,0,160,90",
    });
    expect(cues[1]).toEqual({
      startTime: 10,
      endTime: 20,
      text: "https://example.com/sheet1.jpg#xywh=160,0,160,90",
    });
    expect(cues[2]).toEqual({
      startTime: 20,
      endTime: 30,
      text: "https://example.com/sheet1.jpg#xywh=0,90,160,90",
    });
    // Last cue endTime should be extended to full video duration (3600s)
    expect(cues[3]).toEqual({
      startTime: 30,
      endTime: 3600,
      text: "https://example.com/sheet1.jpg#xywh=160,90,160,90",
    });
  } finally {
    URL.createObjectURL = originalCreateObjectURL;
  }
});
