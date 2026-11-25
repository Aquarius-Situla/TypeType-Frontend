import { afterEach, describe, expect, test } from "bun:test";
import { markWatchIntent, reportStartup } from "../src/lib/startup-report";
import { useFirstFrameStore } from "../src/stores/first-frame-store";

type Sent = { url: string; body: Record<string, unknown> };

function fakeVideo() {
  const listeners = new Set<() => void>();
  return {
    currentTime: 0,
    addEventListener: (_: string, f: () => void) => listeners.add(f),
    removeEventListener: (_: string, f: () => void) => listeners.delete(f),
    tick(time: number) {
      this.currentTime = time;
      for (const f of [...listeners]) f();
    },
    listeners,
  };
}

const realNavigator = globalThis.navigator;
const realWindow = globalThis.window;

function capture(): Sent[] {
  const sent: Sent[] = [];
  Object.defineProperty(globalThis, "window", {
    value: { location: { origin: "https://example.test" } },
    configurable: true,
  });
  Object.defineProperty(globalThis, "navigator", {
    value: {
      sendBeacon: (url: string, blob: Blob) => {
        void blob.text().then((text) => sent.push({ url, body: JSON.parse(text) }));
        return true;
      },
    },
    configurable: true,
  });
  return sent;
}

afterEach(() => {
  Object.defineProperty(globalThis, "navigator", { value: realNavigator, configurable: true });
  Object.defineProperty(globalThis, "window", { value: realWindow, configurable: true });
});

describe("startup report", () => {
  test("measures from the click once the video moves, and only once", async () => {
    const sent = capture();
    markWatchIntent("https://www.youtube.com/watch?v=aqz-KE-bpKQ", true);
    const video = fakeVideo();
    reportStartup(video as unknown as HTMLVideoElement, "aqz-KE-bpKQ");
    video.tick(0);
    expect(video.listeners.size).toBe(1);
    video.tick(0.2);
    video.tick(0.4);
    await Bun.sleep(5);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.url).toBe("https://example.test/api/metrics/startup");
    expect(sent[0]?.body).toMatchObject({ video: "aqz-KE-bpKQ", origin: "click", warmed: true });
    expect(video.listeners.size).toBe(0);
    expect(useFirstFrameStore.getState().videoId).toBe("aqz-KE-bpKQ");
  });

  test("a video opened by its address counts from the page load", async () => {
    const sent = capture();
    const video = fakeVideo();
    reportStartup(video as unknown as HTMLVideoElement, "jNQXAC9IVRw");
    video.tick(0.1);
    await Bun.sleep(5);
    expect(sent[0]?.body).toMatchObject({
      video: "jNQXAC9IVRw",
      origin: "page_load",
      warmed: false,
    });
  });
});
