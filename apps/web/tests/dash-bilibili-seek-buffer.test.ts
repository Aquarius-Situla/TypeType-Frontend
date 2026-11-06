import { expect, test } from "bun:test";
import type * as dashjs from "dashjs";
import { buildDashStreamingSettings } from "../src/components/video-player-core";
import { bilibiliBufferSeconds } from "../src/lib/bilibili-buffer";
import { attachBilibiliSeekBuffer } from "../src/lib/dash-bilibili-seek-buffer";

const buffer = (seconds: number, maxVideoKbps = -1) => ({
  streaming: {
    buffer: {
      bufferTimeDefault: seconds,
      bufferTimeAtTopQuality: seconds,
      bufferTimeAtTopQualityLongForm: seconds,
    },
    abr: { maxBitrate: { video: maxVideoKbps } },
  },
});

test("uses the chosen Bilibili baseline and keeps the backward cache", () => {
  expect(buildDashStreamingSettings("bilibili").buffer).toEqual({
    bufferTimeDefault: 15,
    bufferTimeAtTopQuality: 15,
    bufferTimeAtTopQualityLongForm: 15,
    bufferToKeep: 20,
    fastSwitchEnabled: false,
  });
  expect(buildDashStreamingSettings("bilibili").abr).toEqual({
    initialBitrate: { video: 1000 },
    rules: { abandonRequestsRule: { active: false } },
  });
  expect(buildDashStreamingSettings("youtube").abr).toBeUndefined();
  expect(buildDashStreamingSettings("youtube").buffer).toEqual({
    bufferTimeDefault: 24,
    bufferTimeAtTopQuality: 36,
    bufferTimeAtTopQualityLongForm: 60,
    bufferToKeep: 20,
  });
});

test("the buffer grows with the playback speed and stays capped", () => {
  expect(bilibiliBufferSeconds("normal", 1)).toBe(15);
  expect(bilibiliBufferSeconds("normal", 2)).toBe(30);
  expect(bilibiliBufferSeconds("normal", 4)).toBe(60);
  expect(bilibiliBufferSeconds("saver", 0.5)).toBe(8);
  expect(bilibiliBufferSeconds("large", 16)).toBe(120);
});

function fakePlayer(rate = 1) {
  const listeners = new Map<string, (event: unknown) => void>();
  const updates: unknown[] = [];
  const state = { paused: true, seeking: true, rate, current: "v0" };
  const switches: string[] = [];
  const allowed = [
    { id: "v2", bandwidth: 787_000 },
    { id: "v3", bandwidth: 350_000 },
  ];
  const player = {
    on: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
    updateSettings: (settings: unknown) => updates.push(settings),
    isPaused: () => state.paused,
    isSeeking: () => state.seeking,
    getPlaybackRate: () => state.rate,
    getRepresentationsByType: () => allowed,
    getCurrentRepresentationForType: () => ({ id: state.current }),
    setRepresentationForTypeById: (_type: string, id: string) => {
      switches.push(id);
      state.current = id;
    },
  } as unknown as dashjs.MediaPlayerClass;
  return { player, listeners, updates, state, switches };
}

function playing(listeners: Map<string, (event: unknown) => void>) {
  listeners.get("playbackPlaying")?.({});
}

test("keeps the Bilibili seek target short until playback advances without flushing cache", () => {
  const { player, listeners, updates, state } = fakePlayer();
  attachBilibiliSeekBuffer(player, (rate) => bilibiliBufferSeconds("normal", rate));
  playing(listeners);

  listeners.get("playbackSeeking")?.({ seekTime: 30 });
  expect(updates).toEqual([buffer(2, 1000)]);
  expect(JSON.stringify(updates)).not.toContain("bufferToKeep");

  listeners.get("playbackTimeUpdated")?.({ time: 31.6 });
  expect(updates).toHaveLength(1);

  state.paused = false;
  state.seeking = false;
  listeners.get("playbackTimeUpdated")?.({ time: 31.4 });
  expect(updates).toHaveLength(1);
  listeners.get("playbackTimeUpdated")?.({ time: 31.5 });
  expect(updates[1]).toEqual(buffer(15));
});

test("a speed change resizes the buffer, but not during a pending seek", () => {
  const { player, listeners, updates, state } = fakePlayer(2);
  attachBilibiliSeekBuffer(player, (rate) => bilibiliBufferSeconds("normal", rate));

  listeners.get("playbackRateChanged")?.({});
  expect(updates).toEqual([buffer(30)]);
  playing(listeners);

  listeners.get("playbackSeeking")?.({ seekTime: 10 });
  state.rate = 4;
  listeners.get("playbackRateChanged")?.({});
  expect(updates).toEqual([buffer(30), buffer(2, 1000)]);

  state.paused = false;
  state.seeking = false;
  listeners.get("playbackTimeUpdated")?.({ time: 11.5 });
  expect(updates[2]).toEqual(buffer(60));
});

test("a seek switches to the best quality under the light cap at once", () => {
  const { player, listeners, switches } = fakePlayer();
  attachBilibiliSeekBuffer(player, (rate) => bilibiliBufferSeconds("normal", rate));
  playing(listeners);

  listeners.get("playbackSeeking")?.({ seekTime: 30 });
  listeners.get("playbackSeeking")?.({ seekTime: 60 });

  expect(switches).toEqual(["v2"]);
});

test("the start position seek keeps the quality the first segment is loading in", () => {
  const { player, listeners, updates, switches } = fakePlayer();
  attachBilibiliSeekBuffer(player, (rate) => bilibiliBufferSeconds("normal", rate));

  listeners.get("playbackSeeking")?.({ seekTime: 0 });

  expect(switches).toEqual([]);
  expect(updates).toEqual([]);
});
