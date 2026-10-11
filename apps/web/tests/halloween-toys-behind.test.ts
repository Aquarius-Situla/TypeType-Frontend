import { describe, expect, test } from "bun:test";
import {
  arrange,
  flickerLamp,
  TOYS,
  TOYS_START,
  type ToysEvent,
  type ToysState,
  type ToysView,
  toysCalm,
  toysStep,
} from "../src/halloween/corridor/toys-behind";

const start = TOYS.fromDistance + 400;
const ahead: ToysView = { x: 0, distance: start, yaw: 0, speed: 230, lit: true };
const back: ToysView = { ...ahead, yaw: Math.PI, speed: 0 };

function run(
  state: ToysState,
  view: ToysView,
  ms: number,
  calm = true,
): { state: ToysState; events: ToysEvent[] } {
  let s = state;
  const events: ToysEvent[] = [];
  for (let t = 0; t < ms; t += 50) {
    const stepped = toysStep(s, view, calm, 0.05);
    s = stepped.state;
    if (stepped.event) events.push(stepped.event);
  }
  return { state: s, events };
}

describe("toys that pile up behind the walker", () => {
  test("only drop in the calm stretch of the corridor", () => {
    expect(toysCalm(TOYS.fromDistance - 1)).toBe(false);
    expect(toysCalm(start)).toBe(true);
    expect(run(TOYS_START, ahead, TOYS.firstAwayMs + 500, false).state.stage).toBe(0);
  });

  test("drop one toy out of sight after walking ahead long enough", () => {
    const early = run(TOYS_START, ahead, TOYS.firstAwayMs - 500);
    expect(early.events).toEqual([]);
    const { state, events } = run(TOYS_START, ahead, TOYS.firstAwayMs + 100);
    expect(events).toEqual(["drop"]);
    expect(state.toys).toHaveLength(1);
    expect(state.toys[0]?.distance).toBeLessThan(start);
  });

  test("come closer and more numerous each time they are seen", () => {
    let state = run(TOYS_START, ahead, TOYS.firstAwayMs + 100).state;
    const gaps: number[] = [];
    for (let stage = 1; stage <= 3; stage += 1) {
      expect(state.toys).toHaveLength(stage);
      gaps.push(Math.min(...state.toys.map((toy) => start - toy.distance)));
      state = run(state, back, 1000).state;
      if (stage < 3) state = run(state, ahead, TOYS.nextAwayMs + 100).state;
    }
    expect(gaps[0]).toBeGreaterThan(gaps[1] ?? 0);
    expect(gaps[1]).toBeGreaterThan(gaps[2] ?? 0);
  });

  test("the third sighting flickers the lamp and clears everything for good", () => {
    let state = run(TOYS_START, ahead, TOYS.firstAwayMs + 100).state;
    for (let stage = 1; stage < 3; stage += 1) {
      state = run(state, back, 1000).state;
      state = run(state, ahead, TOYS.nextAwayMs + 100).state;
    }
    const seen = run(state, back, TOYS.finalHoldMs + 100);
    expect(seen.events).toEqual(["flicker"]);
    expect(flickerLamp(seen.state)).toBeLessThan(1);
    const after = run(seen.state, back, TOYS.flickerMs + 100);
    expect(after.state.phase).toBe("done");
    expect(after.state.toys).toEqual([]);
    expect(flickerLamp(after.state)).toBe(1);
    expect(run(after.state, ahead, 20000).events).toEqual([]);
  });

  test("follow a walker who keeps going without turning around", () => {
    const placed = run(TOYS_START, ahead, TOYS.firstAwayMs + 100).state;
    const further = { ...ahead, distance: start + 2500 };
    const followed = toysStep(placed, further, true, 0.05).state;
    expect(followed.toys[0]?.distance).toBe(arrange(1, further)[0]?.distance);
  });

  test("are not seen in the dark", () => {
    const placed = run(TOYS_START, ahead, TOYS.firstAwayMs + 100).state;
    expect(run(placed, { ...back, lit: false }, 2000).state.phase).toBe("placed");
  });
});
