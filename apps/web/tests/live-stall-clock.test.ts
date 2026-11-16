import { expect, test } from "bun:test";
import { LIVE_STALL_MS, nextStallClock } from "../src/lib/live-stall-clock";

const playing = { playing: true, visible: true };

test("a visible live whose clock stops is reported once the delay passes", () => {
  let state = { clock: 10, since: 0 };
  let next = nextStallClock(state, { ...playing, clock: 10, now: LIVE_STALL_MS });
  expect(next.stalled).toBe(false);
  state = next.state;
  next = nextStallClock(state, { ...playing, clock: 10, now: LIVE_STALL_MS + 1 });
  expect(next.stalled).toBe(true);
  expect(next.state.since).toBe(LIVE_STALL_MS + 1);
});

test("a moving clock never stalls", () => {
  const next = nextStallClock({ clock: 10, since: 0 }, { ...playing, clock: 11, now: 60_000 });
  expect(next).toEqual({ state: { clock: 11, since: 60_000 }, stalled: false });
});

test("a hidden tab or a paused video never counts as a stall", () => {
  const hidden = nextStallClock(
    { clock: 10, since: 0 },
    { ...playing, visible: false, clock: 10, now: 120_000 },
  );
  expect(hidden.stalled).toBe(false);
  const back = nextStallClock(hidden.state, { ...playing, clock: 10, now: 121_000 });
  expect(back.stalled).toBe(false);
  const paused = nextStallClock(
    { clock: 10, since: 0 },
    { ...playing, playing: false, clock: 10, now: 120_000 },
  );
  expect(paused.stalled).toBe(false);
});
