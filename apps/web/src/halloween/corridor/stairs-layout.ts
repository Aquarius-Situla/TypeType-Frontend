import { CORRIDOR } from "./corridor-config";
import { FIRST_DOOR } from "./corridor-story";

export const STAIR_DOOR = FIRST_DOOR + 4;

export const STAIRS = {
  doorX: CORRIDOR.width / 2,
  doorZ: -(STAIR_DOOR * CORRIDOR.segmentLength + CORRIDOR.segmentLength / 2),
  passage: 160,
  width: 176,
  flightRun: 507,
  flightDrop: 360,
  headroom: 300,
} as const;

export const STAIRS_TOP_X = STAIRS.doorX + STAIRS.passage;
export const SEAL_X = STAIRS_TOP_X + STAIRS.flightRun * 0.38;
export const SEALED_FROM_X = STAIRS_TOP_X + 90;
export const SEAL_RISE_MS = 5800;
const SLOPE = STAIRS.flightDrop / STAIRS.flightRun;

export const FLIGHTS = 9;
export const STAIRS_BOTTOM_X = STAIRS_TOP_X + FLIGHTS * STAIRS.flightRun;
export const BOTTOM_DROP = FLIGHTS * STAIRS.flightDrop;

export const HALL = {
  doorwayX: STAIRS_BOTTOM_X + 90,
  walkwayLength: 1400,
  walkwayWidth: 180,
  stepRun: 50,
  stepRise: 16,
  steps: 3,
  deckLength: 440,
  deckNear: 140,
  deckFar: 380,
  screenRadius: 2400,
  screenHeight: 2400,
  screenArc: 4.4,
  screenLift: 820,
} as const;
export const STEPS_X = HALL.doorwayX + HALL.walkwayLength;
export const DECK_X = STEPS_X + HALL.steps * HALL.stepRun;
export const DECK_DROP = BOTTOM_DROP + HALL.steps * HALL.stepRise;
export const PLATFORM_X = DECK_X + HALL.deckLength * 0.55;
export const SCREEN_X = STEPS_X - 140;

export function stairsDrop(x: number): number {
  if (x >= STEPS_X) {
    const step = Math.min(HALL.steps, Math.ceil((x - STEPS_X) / HALL.stepRun));
    return BOTTOM_DROP + step * HALL.stepRise;
  }
  return Math.min(BOTTOM_DROP, Math.max(0, x - STAIRS_TOP_X) * SLOPE);
}

export function deckHalfWidth(x: number): number {
  const t = Math.max(0, Math.min(1, (x - DECK_X) / HALL.deckLength));
  return (HALL.deckNear + (HALL.deckFar - HALL.deckNear) * t) / 2;
}

export type Ground = { doorOpen: boolean; sealed: boolean };

export function stairsWalkable(x: number, fromDoor: number, body: number): boolean {
  if (x <= HALL.doorwayX) return fromDoor <= STAIRS.width / 2 - body;
  if (x <= DECK_X) return fromDoor <= HALL.walkwayWidth / 2 - body;
  if (x > DECK_X + HALL.deckLength - body) return false;
  return fromDoor <= deckHalfWidth(x) - body;
}
