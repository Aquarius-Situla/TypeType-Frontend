import { CORRIDOR } from "./corridor-config";
import { STAIR_DOOR } from "./stairs-layout";

export function visibleSegments(distance: number): number[] {
  const current = Math.floor(distance / CORRIDOR.segmentLength);
  const first = current - CORRIDOR.segmentsBehind;
  const last = Math.min(current + CORRIDOR.segmentsAhead, STAIR_DOOR - 1);
  return Array.from({ length: last - first + 1 }, (_, i) => first + i);
}
