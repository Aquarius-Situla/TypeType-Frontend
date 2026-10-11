import { describe, expect, test } from "bun:test";
import { WALK } from "../src/halloween/corridor/corridor-config";
import {
  besideCrib,
  crackDue,
  crackShake,
  cryingLevel,
  facesTv,
  fallDepth,
  fallFade,
  insideRoom,
  leanOver,
  NURSERY,
  peersIntoCrib,
  sinkDue,
  trapsOnPull,
} from "../src/halloween/corridor/nursery";

describe("nursery", () => {
  test("the trap opens one time in two", () => {
    expect(trapsOnPull(0.2)).toBe(true);
    expect(trapsOnPull(0.8)).toBe(false);
  });

  test("the floor creaks, cracks, then breaks, one at a time", () => {
    expect(crackDue(0, 0)).toBe("creak");
    expect(crackDue(500, 1)).toBeNull();
    expect(crackDue(NURSERY.crackAtMs, 1)).toBe("crack");
    expect(crackDue(NURSERY.breakAtMs, 2)).toBe("break");
    expect(crackDue(99999, 3)).toBeNull();
    expect(crackShake(NURSERY.breakAtMs)).toBeGreaterThan(crackShake(NURSERY.crackAtMs));
  });

  test("the fall starts slowly, then plunges into black", () => {
    expect(fallDepth(NURSERY.fallMs * 0.2)).toBeLessThan(100);
    expect(fallDepth(NURSERY.fallMs)).toBeGreaterThan(1000);
    expect(fallFade(NURSERY.fallMs * 0.3)).toBe(0);
    expect(fallFade(NURSERY.fallMs)).toBe(1);
  });

  test("crossing the room to the crib takes about twenty seconds of running", () => {
    const seconds = (NURSERY.crib - NURSERY.spawn) / WALK.runSpeed;
    expect(seconds).toBeGreaterThan(17);
    expect(seconds).toBeLessThan(23);
    expect(insideRoom(0, NURSERY.spawn)).toBe(true);
    expect(insideRoom(0, NURSERY.crib)).toBe(false);
    expect(insideRoom(NURSERY.width, 0)).toBe(false);
  });

  test("looking down into the crib from beside it counts, looking away does not", () => {
    const beside = { x: 0, distance: NURSERY.crib - 130, yaw: 0, pitch: -0.6 };
    expect(peersIntoCrib(beside)).toBe(true);
    expect(peersIntoCrib({ ...beside, pitch: 0 })).toBe(false);
    expect(peersIntoCrib({ ...beside, yaw: Math.PI })).toBe(false);
  });

  test("standing at the crib leans the walker over it without touching the mouse", () => {
    const beside = { x: 0, distance: NURSERY.crib - 200, yaw: 0.3, pitch: 0 };
    expect(besideCrib(beside)).toBe(true);
    let pitch = 0;
    for (let i = 0; i < 60; i += 1) pitch = leanOver(pitch, 1 / 60);
    expect(peersIntoCrib({ ...beside, pitch })).toBe(true);
    expect(besideCrib({ ...beside, distance: NURSERY.crib - 900 })).toBe(false);
  });

  test("the television can be faced from the crib", () => {
    const atCrib = { x: 0, distance: NURSERY.crib - 130, yaw: 0, pitch: 0 };
    const toTv = Math.atan2(NURSERY.tv.x, NURSERY.tv.along - atCrib.distance);
    expect(facesTv({ ...atCrib, yaw: toTv })).toBe(true);
    expect(facesTv(atCrib)).toBe(false);
  });

  test("the floor gives way only after the music has played on long enough", () => {
    expect(sinkDue(NURSERY.holdMinMs - 1, 99999)).toBe(false);
    expect(sinkDue(NURSERY.holdMinMs, NURSERY.tvStareMs)).toBe(true);
    expect(sinkDue(NURSERY.holdMinMs, 0)).toBe(false);
    expect(sinkDue(NURSERY.holdMaxMs, 0)).toBe(true);
  });

  test("the crying grows as the walker nears the crib", () => {
    expect(cryingLevel(100)).toBeGreaterThan(cryingLevel(8000));
  });
});
