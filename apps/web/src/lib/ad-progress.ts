import { TRIAL_START } from "./ad-trial";

// Where the viewer stands in the current ad. The running ad keeps this object up to date in place,
// so the ad break can save it without re-rendering the player on every tick.
export type AdProgress = {
  time: number;
  // The three fields below only matter to the interactive trial.
  scene: string;
  seen: string[];
  waiting: boolean;
};

export function freshAdProgress(): AdProgress {
  return { time: 0, scene: TRIAL_START, seen: [TRIAL_START], waiting: false };
}
