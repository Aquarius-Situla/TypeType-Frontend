import { expect, test } from "bun:test";
import { selectBilibiliFlvUrl } from "../src/lib/bilibili-flv-source";
import { resolveManifestSrc } from "../src/lib/stream-src";
import type { VideoStream } from "../src/types/stream";

const handle = "/media/m1_QWHfNF1A7GT8dWqoRv-P2U4Y";
const expectedMediaUrl = "/api/media/m1_QWHfNF1A7GT8dWqoRv-P2U4Y";
const explicitMediaUrl = "/api/media/m1_AWHfNF1A7GT8dWqoRv-P2U4Y";
const mediaPath = (url: string) => new URL(url, "https://typetype.test").pathname;

const firstVideoStream = () =>
  liveStream().videoStreams?.[0] ??
  (() => {
    throw new Error("Missing video fixture");
  })();
const requireMediaPath = (url: string | null) => {
  if (!url) throw new Error("Expected FLV media URL");
  return mediaPath(url);
};
function liveStream(overrides: Partial<VideoStream> = {}): VideoStream {
  return {
    id: "https://live.bilibili.com/24726021",
    title: "Live",
    thumbnail: "",
    rawThumbnail: "",
    rawChannelAvatar: "",
    channelName: "Channel",
    channelAvatar: "",
    views: 0,
    duration: 0,
    isLive: true,
    videoStreams: [
      {
        url: handle,
        format: "",
        resolution: "720p",
        bitrate: null,
        codec: null,
        mimeType: "",
        isVideoOnly: false,
        itag: 0,
        width: 0,
        height: 0,
        fps: 0,
        contentLength: 0,
        initStart: 0,
        initEnd: 0,
        indexStart: 0,
        indexEnd: 0,
        deliveryMethod: "progressive",
      },
    ],
    ...overrides,
  };
}

test("selects a single untyped BiliBili live media handle when no adaptive source exists", () => {
  expect(requireMediaPath(selectBilibiliFlvUrl(liveStream(), true))).toBe(expectedMediaUrl);
});

test("prefers an explicitly identified FLV stream when several progressive streams exist", () => {
  const stream = liveStream({
    videoStreams: [
      firstVideoStream(),
      {
        ...firstVideoStream(),
        url: "/media/m1_AWHfNF1A7GT8dWqoRv-P2U4Y",
        format: "flv",
        mimeType: "video/x-flv",
      },
    ],
  });

  expect(requireMediaPath(selectBilibiliFlvUrl(stream, true))).toBe(explicitMediaUrl);
});

test("does not select a guessed FLV stream when metadata or candidate count is ambiguous", () => {
  const typedMp4 = liveStream({
    videoStreams: [{ ...firstVideoStream(), mimeType: "video/mp4", format: "mp4" }],
  });
  const multipleUnknown = liveStream({
    videoStreams: [
      firstVideoStream(),
      { ...firstVideoStream(), url: "/media/m1_AWHfNF1A7GT8dWqoRv-P2U4Y" },
    ],
  });

  expect(selectBilibiliFlvUrl(typedMp4, true)).toBeNull();
  expect(selectBilibiliFlvUrl(multipleUnknown, true)).toBeNull();
});

test("keeps HLS and DASH sources ahead of FLV", () => {
  const hls = liveStream({ hlsUrl: "/media/m1_AWHfNF1A7GT8dWqoRv-P2U4Y" });
  const dash = liveStream({
    videoOnlyStreams: [{ ...firstVideoStream(), mimeType: "video/mp4" }],
    audioStreams: [
      {
        url: handle,
        format: "mp4",
        bitrate: null,
        codec: "mp4a",
        mimeType: "audio/mp4",
        quality: null,
        audioTrackId: null,
        audioTrackName: null,
        audioLocale: null,
        isOriginal: true,
        itag: 0,
        contentLength: 0,
        initStart: 0,
        initEnd: 0,
        indexStart: 0,
        indexEnd: 0,
      },
    ],
  });

  expect(selectBilibiliFlvUrl(hls, true)).toBeNull();
  expect(selectBilibiliFlvUrl(dash, true)).toBeNull();
  expect(selectBilibiliFlvUrl(hls, true, true)).not.toBeNull();
});

test("uses the FLV provider source for the measured BiliBili live response", async () => {
  const src = resolveManifestSrc(liveStream(), true, false);

  expect(src.type).toBe("video/object");
  expect(src.src).toBeInstanceOf(Blob);
  if (src.src instanceof Blob) {
    expect(src.src.type).toBe("application/x-typetype-bilibili-flv");
    expect(mediaPath(await src.src.text())).toBe(expectedMediaUrl);
  }
});

test("does not select FLV for non-live or non-BiliBili playback", () => {
  expect(selectBilibiliFlvUrl(liveStream(), false)).toBeNull();
  expect(
    selectBilibiliFlvUrl(liveStream({ id: "https://www.youtube.com/watch?v=abc" }), true),
  ).toBeNull();
});
