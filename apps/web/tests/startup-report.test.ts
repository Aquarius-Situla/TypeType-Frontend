import { afterEach, describe, expect, test } from "bun:test";
import { markWatchIntent, reportStartup } from "../src/lib/startup-report";
import { useFirstFrameStore } from "../src/stores/first-frame-store";

type Sent = { url: string; body: Record<string, unknown> };

function fakeVideo(paused = false) {
  const listeners = new Map<string, Set<() => void>>();
  return {
    currentTime: 0,
    paused,
    addEventListener: (type: string, f: () => void) => {
      if (!listeners.has(type)) listeners.set(type, new Set());
      listeners.get(type)?.add(f);
    },
    removeEventListener: (type: string, f: () => void) => listeners.get(type)?.delete(f),
    fire(type: string) {
      for (const f of [...(listeners.get(type) ?? [])]) f();
    },
    tick(time: number) {
      this.currentTime = time;
      this.fire("timeupdate");
    },
    count: () => [...listeners.values()].reduce((total, set) => total + set.size, 0),
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
    expect(video.count()).toBe(2);
    video.tick(0.2);
    video.tick(0.4);
    await Bun.sleep(5);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.url).toBe("https://example.test/api/metrics/startup");
    expect(sent[0]?.body).toMatchObject({
      video: "aqz-KE-bpKQ",
      origin: "click",
      warmed: true,
      waitedForPlay: false,
    });
    expect(video.count()).toBe(0);
    expect(useFirstFrameStore.getState().videoId).toBe("aqz-KE-bpKQ");
  });

  test("a video opened by its address counts from the page load, once per page", async () => {
    const sent = capture();
    const video = fakeVideo(true);
    reportStartup(video as unknown as HTMLVideoElement, "jNQXAC9IVRw");
    video.fire("canplay");
    video.tick(0.1);
    const again = fakeVideo();
    reportStartup(again as unknown as HTMLVideoElement, "jNQXAC9IVRw");
    again.tick(0.1);
    await Bun.sleep(5);
    expect(sent).toHaveLength(1);
    expect(sent[0]?.body).toMatchObject({
      video: "jNQXAC9IVRw",
      origin: "page_load",
      warmed: false,
      waitedForPlay: true,
    });
  });
});
