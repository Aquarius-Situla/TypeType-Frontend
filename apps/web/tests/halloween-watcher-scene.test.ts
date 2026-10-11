import { describe, expect, test } from "bun:test";
import {
  cracksDue,
  NECK_CRACKS,
  NECK_SNAP,
  sceneFocus,
  WATCHER_SCENE,
  watcherFrame,
} from "../src/halloween/corridor/watcher-scene";

describe("watcher scene", () => {
  test("it watches its television, unaware, until it notices the walker", () => {
    expect(watcherFrame(null, 5000)).toMatchObject({ idle: true, tvOff: null, turn: 0, eyes: 0 });
  });

  test("it goes still, then leans to listen while the television still plays", () => {
    expect(watcherFrame(0, 100)).toMatchObject({ idle: false, tvOff: null, tilt: 0 });
    expect(watcherFrame(0, 2100).tilt).toBeCloseTo(0.5);
    expect(watcherFrame(0, 3000)).toMatchObject({ tilt: 1, tvOff: null, turn: 0 });
  });

  test("the television dies, then a long silence before the neck twists", () => {
    expect(watcherFrame(0, WATCHER_SCENE.tvOffAt).tvOff).toBe(0);
    expect(watcherFrame(0, WATCHER_SCENE.tvOffAt + 400).tvOff).toBe(2);
    expect(watcherFrame(0, 6500)).toMatchObject({ tvOff: 4, turn: 0, eyes: 0 });
  });

  test("the head comes round smoothly, slow at both ends, before the face changes", () => {
    const [from, to] = WATCHER_SCENE.turn;
    expect(watcherFrame(0, from + (to - from) / 4).turn).toBeLessThan(0.25);
    expect(watcherFrame(0, (from + to) / 2).turn).toBeCloseTo(0.5);
    expect(watcherFrame(0, to)).toMatchObject({ turn: 1, eyes: 0 });
  });

  test("the eyes open slowly once the head has come round", () => {
    const [from, to] = WATCHER_SCENE.eyes;
    expect(from).toBeGreaterThan(WATCHER_SCENE.turn[1]);
    expect(watcherFrame(0, (from + to) / 2).eyes).toBeCloseTo(0.5);
    expect(watcherFrame(0, to).eyes).toBe(1);
  });

  test("the door slams while it is still there, staring", () => {
    expect(watcherFrame(0, WATCHER_SCENE.slam - 1).slam).toBe(false);
    expect(watcherFrame(0, WATCHER_SCENE.slam)).toMatchObject({ slam: true, eyes: 1, turn: 1 });
  });

  test("the world narrows while peering and only comes back long after the slam", () => {
    expect(sceneFocus(null, null, 0)).toBe(0);
    expect(sceneFocus(0, null, 1500)).toBeCloseTo(0.5);
    expect(sceneFocus(0, 3000, 3000 + WATCHER_SCENE.slam + 1000)).toBe(1);
    const back = 3000 + WATCHER_SCENE.slam + WATCHER_SCENE.holdSilence + WATCHER_SCENE.release;
    expect(sceneFocus(0, 3000, back)).toBe(0);
  });
});

describe("neck cracks", () => {
  test("come one at a time while the head turns, then a heavier snap as it faces the door", () => {
    expect(cracksDue(0, WATCHER_SCENE.turn[0] - 1, 0)).toBe(0);
    expect(cracksDue(0, NECK_CRACKS[0], 0)).toBe(1);
    expect(cracksDue(0, NECK_CRACKS[1], 1)).toBe(1);
    expect(cracksDue(0, WATCHER_SCENE.turn[1], NECK_CRACKS.length)).toBe(0);
    expect(
      NECK_CRACKS.every((at) => at >= WATCHER_SCENE.turn[0] && at < WATCHER_SCENE.turn[1]),
    ).toBe(true);
    expect(NECK_SNAP).toBeLessThan(WATCHER_SCENE.eyes[0]);
  });
});
