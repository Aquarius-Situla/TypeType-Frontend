import { describe, expect, test } from "bun:test";
import { CORRIDOR } from "../src/halloween/corridor/corridor-config";
import { FIRST_DOOR } from "../src/halloween/corridor/corridor-story";
import {
  ALARM,
  alarmFrame,
  alarmInReach,
  alarmPosition,
  hasFireAlarm,
} from "../src/halloween/corridor/fire-alarm";
import { routeSign } from "../src/halloween/corridor/route-signs";
import { STAIR_DOOR } from "../src/halloween/corridor/stairs-layout";
import { HEART_FROM, tension } from "../src/halloween/corridor/tension";
import { slamJolt } from "../src/halloween/corridor/watcher-scene";
import { guessLabels, labelOf } from "../src/halloween/key-labels";

describe("route signs", () => {
  test("lead on to the watcher's door, then to the stairs, and nowhere past them", () => {
    expect(routeSign(1)).toBe("ahead");
    expect(routeSign(FIRST_DOOR)).toBe("left");
    expect(routeSign(STAIR_DOOR - 1)).toBe("ahead");
    expect(routeSign(STAIR_DOOR)).toBeNull();
    const ahead = Array.from({ length: FIRST_DOOR }, (_, i) => routeSign(i)).filter(Boolean);
    expect(ahead.length).toBeGreaterThan(5);
  });
});

describe("fire alarm", () => {
  const segment = Array.from({ length: 40 }, (_, i) => i).find(hasFireAlarm) ?? 0;
  const at = alarmPosition(segment);

  test("can be pulled when standing at it and facing it", () => {
    const walker = { x: at.x - 120, distance: -at.z, yaw: Math.PI / 2 };
    expect(alarmInReach(walker)).toBe(segment);
    expect(alarmInReach({ ...walker, yaw: -Math.PI / 2 })).toBeNull();
    expect(alarmInReach({ ...walker, distance: -at.z + 400 })).toBeNull();
  });

  test("never hangs where a door is", () => {
    expect(hasFireAlarm(STAIR_DOOR)).toBe(false);
  });

  test("pulses smoothly with the siren, cuts to black, then gives the torch back", () => {
    expect(alarmFrame(0)).toMatchObject({ red: 0, siren: true });
    expect(alarmFrame(ALARM.pulseMs / 2).red).toBeCloseTo(1);
    expect(
      Math.abs(alarmFrame(ALARM.pulseMs / 2 + 16).red - alarmFrame(ALARM.pulseMs / 2).red),
    ).toBeLessThan(0.01);
    expect(alarmFrame(ALARM.sirenMs + 100)).toMatchObject({ red: 0, lamp: 0, siren: false });
    expect(alarmFrame(ALARM.sirenMs + ALARM.blackMs + ALARM.flickerMs + 1)).toMatchObject({
      lamp: 1,
      done: true,
    });
  });

  test("sits within the corridor's segments", () => {
    expect(at.z).toBeLessThan(-segment * CORRIDOR.segmentLength);
  });
});

describe("tension", () => {
  const calm = {
    focus: 0,
    watched: false,
    alarm: false,
    shaking: false,
    onStairs: false,
    blind: false,
    screenOn: false,
    faceShown: false,
  };

  test("is low in the corridor and peaks when the watcher turns", () => {
    expect(tension(calm)).toBeLessThan(HEART_FROM);
    expect(tension({ ...calm, watched: true })).toBe(1);
    expect(tension({ ...calm, onStairs: true })).toBeLessThan(HEART_FROM);
    expect(tension({ ...calm, onStairs: true, blind: true })).toBeGreaterThan(HEART_FROM);
    expect(tension({ ...calm, faceShown: true })).toBeGreaterThan(HEART_FROM);
  });
});

describe("slam jolt", () => {
  test("hits hard at once and has settled after a second and a half", () => {
    expect(slamJolt(10).shake).toBeGreaterThan(8);
    expect(slamJolt(70).recoil).toBeCloseTo(9);
    expect(slamJolt(2000)).toEqual({ shake: 0, recoil: 0 });
  });
});

describe("key labels", () => {
  test("guess AZERTY for French keyboards only", () => {
    expect(guessLabels("fr-FR").KeyW).toBe("Z");
    expect(guessLabels("fr").KeyA).toBe("Q");
    expect(guessLabels("fr-CA").KeyW).toBe("W");
    expect(guessLabels("en-US").KeyW).toBe("W");
  });

  test("learn only plain letters from key presses", () => {
    expect(labelOf("z")).toBe("Z");
    expect(labelOf(",")).toBeNull();
    expect(labelOf("ArrowUp")).toBeNull();
  });
});
