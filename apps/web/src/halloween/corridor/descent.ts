import { CORRIDOR } from "./corridor-config";
import { STAIR_DOOR } from "./stairs-layout";
import type { Walker } from "./walker";

const DOOR_OPENING_MS = 5200;
const DOOR_WAKES_AT = STAIR_DOOR * CORRIDOR.segmentLength - CORRIDOR.segmentLength;

export function doorShouldOpen(walker: Walker, watcherSeen: boolean): boolean {
  return watcherSeen && walker.distance >= DOOR_WAKES_AT;
}

export function doorOpening(openedAt: number | null, now: number): number {
  if (openedAt === null) return 0;
  const t = Math.min(1, (now - openedAt) / DOOR_OPENING_MS);
  return 0.5 - 0.5 * Math.cos(Math.PI * t);
}
