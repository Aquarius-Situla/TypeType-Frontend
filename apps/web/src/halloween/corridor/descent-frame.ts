import { CORRIDOR, WALK } from "./corridor-config";
import {
  type Ground,
  SEALED_FROM_X,
  STAIR_DOOR,
  STAIRS,
  STAIRS_TOP_X,
  stairsWalkable,
} from "./stairs-layout";

export const END_DISTANCE = STAIR_DOOR * CORRIDOR.segmentLength;
export const DESCENT_TURN = Math.PI / 2;
export const DESCENT_ORIGIN = { x: -STAIRS.doorZ, z: STAIRS.doorX - END_DISTANCE } as const;

const BODY = 25;
const DOOR_HALF = 75;

type Spot = { x: number; distance: number };

export function toDescent(x: number, distance: number): Spot {
  return { x: STAIRS.doorX + distance - END_DISTANCE, distance: -STAIRS.doorZ - x };
}

export function fromDescent(x: number, distance: number): Spot {
  return { x: -STAIRS.doorZ - distance, distance: END_DISTANCE + x - STAIRS.doorX };
}

export function descentPoint(x: number, y: number, z: number): { x: number; y: number; z: number } {
  const world = fromDescent(x, -z);
  return { x: world.x, y, z: -world.distance };
}

export function walkable(x: number, distance: number, ground: Ground): boolean {
  if (distance <= END_DISTANCE - WALK.wallMargin)
    return Math.abs(x) <= CORRIDOR.width / 2 - WALK.wallMargin;
  const inner = toDescent(x, distance);
  if (ground.sealed && inner.x < SEALED_FROM_X) return false;
  if (inner.x <= STAIRS_TOP_X) return ground.doorOpen && Math.abs(x) <= DOOR_HALF - BODY;
  return stairsWalkable(inner.x, Math.abs(x), BODY);
}
