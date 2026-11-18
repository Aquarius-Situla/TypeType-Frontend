export const LIVE_STALL_MS = 8_000;

export type StallClock = { clock: number; since: number };

export type StallSample = { clock: number; now: number; playing: boolean; visible: boolean };

// A hidden tab never counts: browsers suspend a muted video there without pausing it, and treating that as a stall
// restarted the player each time the viewer came back to the tab.
export function nextStallClock(
  state: StallClock,
  sample: StallSample,
): { state: StallClock; stalled: boolean } {
  if (!sample.playing || !sample.visible || sample.clock !== state.clock)
    return { state: { clock: sample.clock, since: sample.now }, stalled: false };
  if (sample.now - state.since <= LIVE_STALL_MS) return { state, stalled: false };
  return { state: { clock: sample.clock, since: sample.now }, stalled: true };
}
