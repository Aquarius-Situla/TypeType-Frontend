import { afterEach, expect, test } from "bun:test";
import { MediaTracksMixin } from "@videojs/media/media-tracks";
import { mirrorSabrRenditions } from "../src/lib/sabr-video-renditions";
import { type SabrQualityOption, useSabrQualityStore } from "../src/stores/sabr-quality-store";

class Host extends MediaTracksMixin(EventTarget) {}

function option(itag: number, height: number): SabrQualityOption {
  return {
    itag,
    label: `${height}p`,
    height,
    codec: "avc1",
    codecValue: "avc1.640028",
    mimeType: "video/mp4",
    width: Math.round((height * 16) / 9),
    fps: 30,
    bitrate: height * 4000,
  };
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const ids = (host: Host) => [...host.videoRenditions].map((rendition) => rendition.id);

let release: (() => void) | null = null;

afterEach(() => {
  release?.();
  release = null;
  useSabrQualityStore.setState({
    streamId: null,
    options: [],
    selectedItag: null,
    automaticItag: null,
    manuallySelected: false,
  });
});

test("mirrors the SABR resolutions with the automatic one active and nothing pinned", () => {
  useSabrQualityStore.getState().setOptions("video", [option(137, 1080), option(136, 720)], 136);
  const host = new Host();
  release = mirrorSabrRenditions(host);

  expect(ids(host)).toEqual(["137", "136"]);
  expect(host.videoRenditions.selectedIndex).toBe(-1);
  expect([...host.videoRenditions].find((rendition) => rendition.active)?.id).toBe("136");
});

test("a picked rendition pins the SABR quality and auto returns to the automatic one", async () => {
  useSabrQualityStore.getState().setOptions("video", [option(137, 1080), option(136, 720)], 136);
  const host = new Host();
  release = mirrorSabrRenditions(host);

  host.videoRenditions.selectedIndex = 0;
  await settle();
  expect(useSabrQualityStore.getState().selectedItag).toBe(137);
  expect(useSabrQualityStore.getState().manuallySelected).toBe(true);
  expect(host.videoRenditions.selectedIndex).toBe(0);

  host.videoRenditions.selectedIndex = -1;
  await settle();
  expect(useSabrQualityStore.getState().selectedItag).toBe(136);
  expect(useSabrQualityStore.getState().manuallySelected).toBe(false);
});

test("a single resolution exposes no rendition list", () => {
  useSabrQualityStore.getState().setOptions("video", [option(136, 720)], 136);
  const host = new Host();
  release = mirrorSabrRenditions(host);

  expect(ids(host)).toEqual([]);
});
