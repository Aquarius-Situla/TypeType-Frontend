import { expect, test } from "bun:test";
import { videoJsSource } from "../src/lib/video-js-source";

test("recognises HLS, DASH and progressive sources", () => {
  expect(
    videoJsSource({ src: "/live/hls/master.m3u8?c=x", type: "application/x-mpegurl" }),
  ).toEqual({
    kind: "hls",
    src: "/live/hls/master.m3u8?c=x",
    type: "application/x-mpegurl",
  });
  expect(videoJsSource("https://cdn.example/clip.mp4")?.kind).toBe("file");
  expect(
    videoJsSource({
      src: "data:application/dash+xml;base64,PE1QRD4=",
      type: "application/dash+xml",
    })?.kind,
  ).toBe("dash");
});

test("leaves engine specific sources to Vidstack", () => {
  expect(videoJsSource({ src: new Blob(["id"]), type: "video/object" })).toBeNull();
  expect(videoJsSource({ src: "https://cdn.example/a.flv", type: "video/x-flv" })).toBeNull();
  expect(videoJsSource([{ src: "a.mp4", type: "video/mp4" }])).toBeNull();
  expect(videoJsSource("https://cdn.example/stream")).toBeNull();
});
