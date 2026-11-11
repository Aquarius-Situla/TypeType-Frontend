// Where the skip button of an ad runs to. Positions are in percent of the ad frame.
export type AdSkipSpot = { left: number; top: number };

// Keeps the whole button inside the frame and clear of the controls along its bottom edge.
const MIN: AdSkipSpot = { left: 4, top: 8 };
const MAX: AdSkipSpot = { left: 72, top: 68 };
const SAFE_FROM_POINTER = 32;
const WORTH_THE_RUN = 22;
const TRIES = 10;
const RUN_SPEED = 75;

function distance(a: AdSkipSpot, b: AdSkipSpot): number {
  return Math.hypot(a.left - b.left, a.top - b.top);
}

// Somewhere away from the pointer, and far enough from here for the move to read as a flight.
// It is not always the farthest corner: the button would be too easy to wait for.
export function fleeSpot(
  from: AdSkipSpot,
  pointer: AdSkipSpot,
  random: () => number = Math.random,
): AdSkipSpot {
  let farthest: AdSkipSpot | null = null;
  for (let attempt = 0; attempt < TRIES; attempt += 1) {
    const spot = {
      left: MIN.left + random() * (MAX.left - MIN.left),
      top: MIN.top + random() * (MAX.top - MIN.top),
    };
    if (distance(spot, pointer) >= SAFE_FROM_POINTER && distance(spot, from) >= WORTH_THE_RUN) {
      return spot;
    }
    if (!farthest || distance(spot, pointer) > distance(farthest, pointer)) farthest = spot;
  }
  return farthest ?? from;
}

// Off the frame, by the side opposite the pointer.
export function exitSpot(from: AdSkipSpot, pointer: AdSkipSpot): AdSkipSpot {
  return { left: pointer.left < from.left ? 115 : -35, top: from.top };
}

export function runSeconds(from: AdSkipSpot, to: AdSkipSpot): number {
  return Math.min(0.9, Math.max(0.3, distance(from, to) / RUN_SPEED));
}
