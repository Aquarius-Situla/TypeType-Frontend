import { describe, expect, test } from "bun:test";
import {
  type DoorWatch,
  doorGap,
  doorZ,
  nextDoorSegment,
  watchDoor,
  watcherDoorSide,
} from "../src/halloween/corridor/corridor-story";

describe("cat doors", () => {
  test("stay away during the first long stretch, then come rarely", () => {
    const doors = Array.from({ length: 200 }, (_, segment) => watcherDoorSide(segment)).filter(
      Boolean,
    );
    expect(watcherDoorSide(5)).toBeNull();
    expect(doors.length).toBeGreaterThan(2);
    expect(doors.length).toBeLessThan(8);
  });

  const peeking = (segment: number, side: "left" | "right") => {
    const gap = doorGap(segment, side);
    const x = gap.x * 0.75;
    const distance = -gap.z - 40;
    const yaw = Math.atan2(gap.x - x, -(gap.z + distance));
    return { x, distance, yaw };
  };

  test("slams only after peering through the gap for three seconds", () => {
    const segment = nextDoorSegment(0);
    const side = watcherDoorSide(segment) ?? "left";
    const walker = peeking(segment, side);
    let watch: DoorWatch = { segment, since: null, noticed: false };
    watch = watchDoor(watch, walker, side, 0);
    watch = watchDoor(watch, walker, side, 2500);
    expect(watch.noticed).toBe(false);
    watch = watchDoor(watch, walker, side, 3100);
    expect(watch.noticed).toBe(true);
  });

  test("resets when the walker looks away", () => {
    const segment = nextDoorSegment(0);
    const side = watcherDoorSide(segment) ?? "left";
    const peek = peeking(segment, side);
    let watch: DoorWatch = { segment, since: null, noticed: false };
    watch = watchDoor(watch, peek, side, 0);
    watch = watchDoor(watch, { ...peek, yaw: 0 }, side, 2000);
    watch = watchDoor(watch, peek, side, 2500);
    watch = watchDoor(watch, peek, side, 4000);
    expect(watch.noticed).toBe(false);
  });

  test("does not slam for a walker merely looking at the door from the middle of the corridor", () => {
    const segment = nextDoorSegment(0);
    const side = watcherDoorSide(segment) ?? "left";
    const walker = { x: 0, distance: -doorZ(segment) - 400, yaw: side === "left" ? -0.6 : 0.6 };
    let watch: DoorWatch = { segment, since: null, noticed: false };
    for (let t = 0; t <= 6000; t += 500) watch = watchDoor(watch, walker, side, t);
    expect(watch.noticed).toBe(false);
  });

  test("ignores a walker far down the corridor", () => {
    const segment = nextDoorSegment(0);
    const watch = watchDoor(
      { segment, since: 0, noticed: false },
      { x: 0, distance: 0, yaw: 0 },
      "left",
      9000,
    );
    expect(watch.noticed).toBe(false);
  });
});
