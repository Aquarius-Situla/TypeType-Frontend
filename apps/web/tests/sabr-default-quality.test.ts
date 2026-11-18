import { expect, test } from "bun:test";
import { resolvePreferredSabrQuality } from "../src/hooks/use-sabr-playback-config";
import { automaticSabrQuality, defaultSabrItag } from "../src/lib/sabr-source";
import { type SabrQualityOption, useSabrQualityStore } from "../src/stores/sabr-quality-store";

function option(itag: number, height: number): SabrQualityOption {
  return {
    itag,
    label: `${height}p`,
    height,
    codec: "H.264",
    codecValue: "avc1.64001f",
    mimeType: "video/mp4",
    width: Math.round((height * 16) / 9),
    fps: 30,
    bitrate: 1_000_000,
  };
}

const options = [option(401, 2160), option(271, 1440), option(137, 1080), option(136, 720)];

test("respects the preferred sabr resolution above 720p", () => {
  expect(defaultSabrItag(options, "1080p")).toBe(137);
  expect(defaultSabrItag(options, "2160p")).toBe(401);
});

test("selects portrait video by canonical quality instead of encoded height", () => {
  const portrait = [
    { ...option(399, 1920), label: "1080p", width: 1080 },
    { ...option(398, 1280), label: "720p", width: 720 },
    { ...option(397, 854), label: "480p", width: 480 },
  ];

  expect(defaultSabrItag(portrait, "720p")).toBe(398);
});

test("chooses automatic quality from display and network constraints", () => {
  expect(automaticSabrQuality(1080, 1)).toBe("1080p");
  expect(automaticSabrQuality(1440, 2)).toBe("2160p");
  expect(automaticSabrQuality(2160, 1, true, "4g")).toBe("360p");
  expect(automaticSabrQuality(2160, 1, false, "3g")).toBe("720p");
});

test("automatic quality on a phone follows the short side of the screen", () => {
  const screen = globalThis.window?.screen;
  const restore = {
    width: screen?.width,
    height: screen?.height,
    dpr: globalThis.window?.devicePixelRatio,
  };
  Object.defineProperty(window, "screen", {
    configurable: true,
    value: { width: 390, height: 844 },
  });
  Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: 3 });
  try {
    expect(resolvePreferredSabrQuality("auto")).toBe("1080p");
    expect(resolvePreferredSabrQuality("720p")).toBe("720p");
  } finally {
    Object.defineProperty(window, "screen", {
      configurable: true,
      value: { width: restore.width, height: restore.height },
    });
    Object.defineProperty(window, "devicePixelRatio", { configurable: true, value: restore.dpr });
  }
});

test("upgrades an automatic startup selection to the preferred resolution", () => {
  useSabrQualityStore.setState({
    streamId: null,
    options: [],
    selectedItag: null,
    manuallySelected: false,
  });
  const store = useSabrQualityStore.getState();
  store.setOptions("video", [option(136, 720)], 136);
  store.setOptions("video", options, 137);
  expect(useSabrQualityStore.getState().selectedItag).toBe(137);
});

test("keeps an explicit quality selection during metadata enrichment", () => {
  const store = useSabrQualityStore.getState();
  store.setOptions("manual-video", options, 137);
  store.selectQuality("manual-video", 136);
  store.setOptions("manual-video", options, 137);
  expect(useSabrQualityStore.getState().selectedItag).toBe(136);
});

test("does not turn an automatic quality rollback into a manual preference", () => {
  const store = useSabrQualityStore.getState();
  store.restoreQuality("manual-video", 136);
  store.setOptions("manual-video", options, 137);
  expect(useSabrQualityStore.getState().selectedItag).toBe(137);
});
