import { describe, expect, test } from "bun:test";
import { CORRIDOR, WALK } from "../src/halloween/corridor/corridor-config";
import { doorOpening, doorShouldOpen } from "../src/halloween/corridor/descent";
import {
  END_DISTANCE,
  fromDescent,
  toDescent,
  walkable as walkableWorld,
} from "../src/halloween/corridor/descent-frame";
import {
  BOTTOM_DROP,
  HALL,
  PLATFORM_X,
  SEAL_X,
  SEALED_FROM_X,
  STAIR_DOOR,
  STAIRS,
  STAIRS_BOTTOM_X,
  STAIRS_TOP_X,
  stairsDrop,
} from "../src/halloween/corridor/stairs-layout";
import { createWalker, NO_INPUT, stepWalker } from "../src/halloween/corridor/walker";

const atDoor = -STAIRS.doorZ;
const open = { doorOpen: true, sealed: false };
const shut = { doorOpen: false, sealed: false };
const wall = CORRIDOR.width / 2 - WALK.wallMargin;
type Ground = typeof open;
const walkable = (x: number, distance: number, ground: Ground): boolean => {
  const world = fromDescent(x, distance);
  return walkableWorld(world.x, world.distance, ground);
};

describe("stairs", () => {
  test("the door wakes a segment early, only after the watcher, and opens slowly", () => {
    expect(doorShouldOpen({ ...createWalker(), distance: 10 }, true)).toBe(false);
    const near = (STAIR_DOOR - 1) * CORRIDOR.segmentLength;
    expect(doorShouldOpen({ ...createWalker(), distance: near }, false)).toBe(false);
    expect(doorShouldOpen({ ...createWalker(), distance: near }, true)).toBe(true);
    expect(doorOpening(null, 5000)).toBe(0);
    expect(doorOpening(0, 1000)).toBeLessThan(0.3);
    expect(doorOpening(0, 9000)).toBe(1);
  });

  test("one unbroken slope: no landing anywhere, a storey per flight", () => {
    expect(stairsDrop(STAIRS_TOP_X - 50)).toBe(0);
    expect(stairsDrop(STAIRS_TOP_X + STAIRS.flightRun / 2)).toBeCloseTo(STAIRS.flightDrop / 2);
    expect(stairsDrop(STAIRS_TOP_X + STAIRS.flightRun * 3)).toBeCloseTo(STAIRS.flightDrop * 3);
    expect(stairsDrop(STAIRS_BOTTOM_X + 500)).toBe(BOTTOM_DROP);
    const a = stairsDrop(STAIRS_TOP_X + STAIRS.flightRun - 5);
    const b = stairsDrop(STAIRS_TOP_X + STAIRS.flightRun + 5);
    expect(b - a).toBeCloseTo((10 * STAIRS.flightDrop) / STAIRS.flightRun);
  });

  test("the corridor ends in a wall with the stair door straight ahead", () => {
    expect(walkableWorld(0, END_DISTANCE - WALK.wallMargin, shut)).toBe(true);
    expect(walkableWorld(0, END_DISTANCE - 20, shut)).toBe(false);
    expect(walkableWorld(0, END_DISTANCE + 40, open)).toBe(true);
    expect(walkableWorld(wall, END_DISTANCE + 40, open)).toBe(false);
    expect(walkableWorld(0, END_DISTANCE + 600, open)).toBe(true);
    const back = fromDescent(STAIRS_TOP_X + 300, atDoor);
    expect(toDescent(back.x, back.distance)).toEqual({ x: STAIRS_TOP_X + 300, distance: atDoor });
    expect(back.distance).toBeGreaterThan(END_DISTANCE);
    expect(back.x).toBeCloseTo(0);
  });

  test("the doorway only lets the walker through once the door is open", () => {
    expect(walkable(STAIRS.doorX + 20, atDoor, shut)).toBe(false);
    expect(walkable(STAIRS.doorX + 20, atDoor, open)).toBe(true);
    expect(walkable(STAIRS.doorX + 20, atDoor + 200, open)).toBe(false);
    expect(walkable(STAIRS_TOP_X + 900, atDoor + 60, open)).toBe(true);
    expect(walkable(STAIRS_TOP_X + 900, atDoor + 120, open)).toBe(false);
  });

  test("once the rock has risen the way back up stops just below it", () => {
    const sealed = { doorOpen: true, sealed: true };
    expect(SEAL_X).toBeGreaterThan(SEALED_FROM_X + 100);
    expect(walkable(SEALED_FROM_X + 10, atDoor, sealed)).toBe(true);
    expect(walkable(SEALED_FROM_X - 10, atDoor, sealed)).toBe(false);
    expect(walkable(STAIRS.doorX + 20, atDoor, sealed)).toBe(false);
  });

  test("walking into a wall slides along it instead of stopping dead", () => {
    const inCorridor = (x: number): boolean => Math.abs(x) <= wall;
    let walker = { ...createWalker(), x: wall - 1 };
    const look = { yaw: 0.6, pitch: 0 };
    const forward = { ...NO_INPUT, forward: true };
    for (let i = 0; i < 120; i += 1) {
      walker = stepWalker(walker, forward, look, 1 / 60, inCorridor).walker;
    }
    expect(walker.x).toBeLessThanOrEqual(wall);
    expect(walker.distance).toBeGreaterThan(100);
  });

  test("the walker can turn right round and walk back", () => {
    let walker = { ...createWalker(), distance: 1000 };
    const back = { yaw: Math.PI, pitch: 0 };
    const forward = { ...NO_INPUT, forward: true };
    for (let i = 0; i < 120; i += 1) {
      walker = stepWalker(walker, forward, back, 1 / 60, () => true).walker;
    }
    expect(walker.distance).toBeLessThan(900);
  });

  test("at the bottom only the walkway and its platform hold the walker", () => {
    const open = { doorOpen: true, sealed: true };
    const along = HALL.doorwayX + HALL.walkwayLength / 2;
    expect(walkable(along, atDoor, open)).toBe(true);
    expect(walkable(along, atDoor + HALL.walkwayWidth, open)).toBe(false);
    expect(walkable(PLATFORM_X, atDoor + HALL.deckFar / 2 - 80, open)).toBe(true);
    expect(walkable(PLATFORM_X + HALL.deckLength, atDoor, open)).toBe(false);
    expect(stairsDrop(PLATFORM_X)).toBe(BOTTOM_DROP + HALL.steps * HALL.stepRise);
  });
});
