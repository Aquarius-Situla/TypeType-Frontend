import { expect, test } from "bun:test";
import { buildBilibiliDashManifest } from "../src/lib/bilibili-manifest";
import type { AudioStreamItem, VideoStreamItem } from "../src/types/api";

const video = {
  url: "https://example.com/video.m4s",
  format: "MPEG-4",
  resolution: "480P",
  bitrate: 790090,
  codec: "avc1.64001F",
  mimeType: "video/mp4",
  isVideoOnly: true,
  itag: -1,
  width: 852,
  height: 480,
  fps: 29,
  contentLength: 0,
  initStart: 0,
  initEnd: 1011,
  indexStart: 1012,
  indexEnd: 1475,
} satisfies VideoStreamItem;

const audio = {
  url: "https://example.com/audio.m4s",
  format: "m4a",
  bitrate: 129717,
  codec: "mp4a",
  mimeType: "audio/mp4",
  quality: "132K",
  audioTrackId: null,
  audioTrackName: null,
  audioLocale: null,
  isOriginal: false,
  itag: -1,
  contentLength: 0,
  initStart: 0,
  initEnd: 907,
  indexStart: 908,
  indexEnd: 1371,
} satisfies AudioStreamItem;

test("describes BiliBili initialization and index byte ranges", () => {
  Object.assign(globalThis, { window: { location: { origin: "https://typetype.test" } } });
  const source = buildBilibiliDashManifest([video], [audio], 179);
  expect(source).not.toBeNull();
  const xml = atob(source?.split(",")[1] ?? "");
  expect(xml).toContain('<SegmentBase indexRange="1012-1475">');
  expect(xml).toContain('<Initialization range="0-1011"/>');
  expect(xml).toContain('<SegmentBase indexRange="908-1371">');
  expect(xml).toContain('<Initialization range="0-907"/>');
});

test("keeps the audio bandwidth in bits per second", () => {
  Object.assign(globalThis, { window: { location: { origin: "https://typetype.test" } } });
  const source = buildBilibiliDashManifest(
    [video],
    [{ ...audio, bitrate: 64762, url: "https://example.com/audio.m4s?bw=66923" }],
    179,
  );
  expect(source).not.toBeNull();
  const xml = atob(source?.split(",")[1] ?? "");
  expect(xml).toContain('bandwidth="66923"');
  expect(xml).not.toContain('bandwidth="64762000"');
});

test("includes all available video resolutions in descending order in a single AdaptationSet", () => {
  Object.assign(globalThis, { window: { location: { origin: "https://typetype.test" } } });
  const video1080: VideoStreamItem = {
    ...video,
    resolution: "1080P",
    width: 1920,
    height: 1080,
    bitrate: 3000000,
    url: "https://example.com/video_1080.m4s",
  };
  const video720: VideoStreamItem = {
    ...video,
    resolution: "720P",
    width: 1280,
    height: 720,
    bitrate: 1500000,
    url: "https://example.com/video_720.m4s",
  };
  const video360: VideoStreamItem = {
    ...video,
    resolution: "360P",
    width: 640,
    height: 360,
    bitrate: 400000,
    url: "https://example.com/video_360.m4s",
  };

  const source = buildBilibiliDashManifest([video, video1080, video720, video360], [audio], 179);
  expect(source).not.toBeNull();
  const xml = atob(source?.split(",")[1] ?? "");

  // All 4 resolutions should be present
  expect(xml).toContain('id="v0" bandwidth="3000000" width="1920" height="1080"');
  expect(xml).toContain('id="v1" bandwidth="1500000" width="1280" height="720"');
  expect(xml).toContain('id="v2" bandwidth="790090" width="852" height="480"');
  expect(xml).toContain('id="v3" bandwidth="400000" width="640" height="360"');

  // Verify order: 1080 -> 720 -> 480 -> 360
  const pos1080 = xml.indexOf('height="1080"');
  const pos720 = xml.indexOf('height="720"');
  const pos480 = xml.indexOf('height="480"');
  const pos360 = xml.indexOf('height="360"');
  expect(pos1080).toBeLessThan(pos720);
  expect(pos720).toBeLessThan(pos480);
  expect(pos480).toBeLessThan(pos360);
});
