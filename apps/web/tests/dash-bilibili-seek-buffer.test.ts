import { expect, test } from "bun:test";
import type * as dashjs from "dashjs";
import { buildDashStreamingSettings } from "../src/components/video-player-core";
import { bilibiliBufferSeconds, isBilibiliCdnRegion } from "../src/lib/bilibili-buffer";
import { attachBilibiliSeekBuffer } from "../src/lib/dash-bilibili-seek-buffer";
import { useBilibiliBufferStore } from "../src/stores/bilibili-buffer-store";

const buffer = (seconds: number) => ({
  streaming: {
    buffer: {
      bufferTimeDefault: seconds,
      bufferTimeAtTopQuality: seconds,
      bufferTimeAtTopQualityLongForm: seconds,
    },
  },
});

test("uses the chosen Bilibili baseline and keeps the backward cache", () => {
  expect(buildDashStreamingSettings("bilibili").buffer).toEqual({
    bufferTimeDefault: 45,
    bufferTimeAtTopQuality: 45,
    bufferTimeAtTopQualityLongForm: 45,
    bufferToKeep: 20,
  });
  expect(buildDashStreamingSettings("youtube").buffer).toEqual({
    bufferTimeDefault: 24,
    bufferTimeAtTopQuality: 36,
    bufferTimeAtTopQualityLongForm: 60,
    bufferToKeep: 20,
  });
});

test("the buffer grows with the playback speed and stays capped", () => {
  expect(bilibiliBufferSeconds("normal", 1)).toBe(45);
  expect(bilibiliBufferSeconds("normal", 2)).toBe(90);
  expect(bilibiliBufferSeconds("normal", 4)).toBe(180);
  expect(bilibiliBufferSeconds("saver", 0.5)).toBe(15);
  expect(bilibiliBufferSeconds("large", 16)).toBe(180);
});

function fakePlayer(rate = 1) {
  const listeners = new Map<string, (event: unknown) => void>();
  const updates: unknown[] = [];
  const state = { paused: true, seeking: true, rate };
  const player = {
    on: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
    updateSettings: (settings: unknown) => updates.push(settings),
    isPaused: () => state.paused,
    isSeeking: () => state.seeking,
    getPlaybackRate: () => state.rate,
  } as unknown as dashjs.MediaPlayerClass;
  return { player, listeners, updates, state };
}

test("keeps the Bilibili seek target short until playback advances without flushing cache", () => {
  const { player, listeners, updates, state } = fakePlayer();
  attachBilibiliSeekBuffer(player, (rate) => bilibiliBufferSeconds("normal", rate));

  listeners.get("playbackSeeking")?.({ seekTime: 30 });
  expect(updates).toEqual([buffer(2)]);
  expect(JSON.stringify(updates)).not.toContain("bufferToKeep");

  listeners.get("playbackTimeUpdated")?.({ time: 31.6 });
  expect(updates).toHaveLength(1);

  state.paused = false;
  state.seeking = false;
  listeners.get("playbackTimeUpdated")?.({ time: 31.4 });
  expect(updates).toHaveLength(1);
  listeners.get("playbackTimeUpdated")?.({ time: 31.5 });
  expect(updates[1]).toEqual(buffer(45));
});

test("a speed change resizes the buffer, but not during a pending seek", () => {
  const { player, listeners, updates, state } = fakePlayer(2);
  attachBilibiliSeekBuffer(player, (rate) => bilibiliBufferSeconds("normal", rate));

  listeners.get("playbackRateChanged")?.({});
  expect(updates).toEqual([buffer(90)]);

  listeners.get("playbackSeeking")?.({ seekTime: 10 });
  state.rate = 4;
  listeners.get("playbackRateChanged")?.({});
  expect(updates).toEqual([buffer(90), buffer(2)]);

  state.paused = false;
  state.seeking = false;
  listeners.get("playbackTimeUpdated")?.({ time: 11.5 });
  expect(updates[2]).toEqual(buffer(180));
});

test("validates bilibili cdn region and store defaults", () => {
  expect(isBilibiliCdnRegion("overseas")).toBe(true);
  expect(isBilibiliCdnRegion("domestic")).toBe(true);
  expect(isBilibiliCdnRegion("auto")).toBe(false);
  expect(isBilibiliCdnRegion("invalid")).toBe(false);

  const state = useBilibiliBufferStore.getState();
  expect(state.serverRegion).toBe("overseas");
  expect(state.concurrentPrefetch).toBe(true);
});
