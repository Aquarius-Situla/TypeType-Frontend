import { actor, ghost, satellite, soap } from "./ad-skip-acts-drift";
import { decoys, shyCat, teleporter } from "./ad-skip-acts-flee";
import { balloon, mole } from "./ad-skip-acts-show";
import type { SkipAct } from "./ad-skip-stage";

// The acts of the skip button besides the runner (components/ad-skip-runner.tsx): each one is a
// different way for the button never to be skipped. An act drives the button of its stage directly.

export const SKIP_ACTS = {
  teleporter,
  shyCat,
  decoys,
  mole,
  balloon,
  ghost,
  soap,
  actor,
  satellite,
} satisfies Record<string, SkipAct>;

export type SkipActName = keyof typeof SKIP_ACTS;
// The runner is the original act, drawn by its own component.
export type SkipVariant = SkipActName | "runner";

const VARIANTS: SkipVariant[] = ["runner", ...(Object.keys(SKIP_ACTS) as SkipActName[])];
let lastVariant: SkipVariant | null = null;

// One act per ad, never the one of the ad before. `random` returns a number in [0, 1).
export function pickSkipVariant(random: () => number = Math.random): SkipVariant {
  const choices = VARIANTS.filter((variant) => variant !== lastVariant);
  const variant = choices[Math.floor(random() * choices.length)] ?? "runner";
  lastVariant = variant;
  return variant;
}

export function skipVariants(): readonly SkipVariant[] {
  return VARIANTS;
}
