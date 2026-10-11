import { expect, test } from "bun:test";
import {
  sabrBootstrapEndpoint,
  sabrBootstrapQueryKey,
  streamEndpoint,
  streamQueryKey,
} from "../src/lib/stream-request";

const VIDEO_URL = "https://www.youtube.com/watch?v=test";

test("uses SABR for YouTube and provider-specific direct endpoints", () => {
  expect(streamEndpoint(VIDEO_URL)).toContain("/streams/youtube/sabr?url=");
  expect(streamQueryKey(VIDEO_URL, false)).toEqual(["stream", VIDEO_URL, "anon"]);
  expect(streamEndpoint(VIDEO_URL, true)).toContain("/streams/youtube/live?url=");
  expect(streamQueryKey(VIDEO_URL, false, null, true)).toEqual(["stream", VIDEO_URL, "live:anon"]);
  expect(streamQueryKey(VIDEO_URL, false, null, true)).not.toEqual(
    streamQueryKey(VIDEO_URL, false),
  );
  expect(streamEndpoint("https://www.nicovideo.jp/watch/test")).toContain("/streams/niconico?url=");
  expect(streamEndpoint("https://www.bilibili.com/video/test")).toContain("/streams/bilibili?url=");
  expect(() => streamEndpoint("https://example.com/video")).toThrow("Unsupported video provider");
});

test("marks a request made before anyone watches, and only that one", () => {
  expect(streamEndpoint(VIDEO_URL, false, true)).toEndWith("&intent=preview");
  expect(streamEndpoint(VIDEO_URL, true, true)).toEndWith("&intent=preview");
  expect(streamEndpoint(VIDEO_URL)).not.toContain("intent=");
  expect(streamEndpoint(VIDEO_URL, true)).not.toContain("intent=");
});

test("uses an isolated YouTube SABR bootstrap request", () => {
  expect(sabrBootstrapEndpoint(VIDEO_URL)).toContain("/streams/youtube/sabr/bootstrap?url=");
  expect(sabrBootstrapQueryKey(VIDEO_URL, true)).toEqual(["stream-bootstrap", VIDEO_URL, "auth"]);
  expect(sabrBootstrapEndpoint("https://www.nicovideo.jp/watch/test")).toBeNull();
});
