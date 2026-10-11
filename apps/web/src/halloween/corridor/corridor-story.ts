import { CORRIDOR } from "./corridor-config";

export type Side = "left" | "right";

export const FIRST_DOOR = 32;
const DOOR_EVERY = 41;

export function watcherDoorSide(segment: number): Side | null {
  if (segment < FIRST_DOOR || (segment - FIRST_DOOR) % DOOR_EVERY !== 0) return null;
  return ((segment - FIRST_DOOR) / DOOR_EVERY) % 2 === 0 ? "left" : "right";
}

export function doorZ(segment: number): number {
  return -(segment * CORRIDOR.segmentLength + CORRIDOR.segmentLength / 2);
}

export function doorX(side: Side): number {
  return (side === "left" ? -1 : 1) * (CORRIDOR.width / 2);
}

export type DoorWatch = { segment: number; since: number | null; noticed: boolean };

export const PEEK_MS = 3000;
const PEEK_ANGLE = 0.45;
const PEEK_DISTANCE = 380;
const GAP_FROM_SEGMENT_START = 268;

export function doorGap(segment: number, side: Side): { x: number; z: number } {
  const start = -segment * CORRIDOR.segmentLength;
  return { x: doorX(side), z: start - GAP_FROM_SEGMENT_START };
}

export function watchDoor(
  watch: DoorWatch,
  walker: { x: number; distance: number; yaw: number },
  side: Side,
  now: number,
): DoorWatch {
  if (watch.noticed) return watch;
  const gap = doorGap(watch.segment, side);
  const dx = gap.x - walker.x;
  const dz = gap.z + walker.distance;
  const close = Math.hypot(dx, dz) < PEEK_DISTANCE;
  const angle = Math.atan2(dx, -dz) - walker.yaw;
  const facing = Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < PEEK_ANGLE;
  if (!close || !facing) return { ...watch, since: null };
  const since = watch.since ?? now;
  return { ...watch, since, noticed: now - since >= PEEK_MS };
}

export type PeekSpot = { x: number; distance: number; yaw: number; pitch: number };

export function peekSpot(segment: number, side: Side): PeekSpot {
  const gap = doorGap(segment, side);
  const inset = (side === "left" ? 1 : -1) * 130;
  const x = gap.x + inset;
  return { x, distance: -gap.z - 120, yaw: Math.atan2(gap.x - x, 120), pitch: -0.05 };
}

export function nextDoorSegment(fromSegment: number): number {
  if (fromSegment <= FIRST_DOOR) return FIRST_DOOR;
  return FIRST_DOOR + Math.ceil((fromSegment - FIRST_DOOR) / DOOR_EVERY) * DOOR_EVERY;
}

export function nearestDoor(segment: number): number | null {
  for (let s = Math.max(0, segment - 1); s <= segment + 10; s += 1)
    if (watcherDoorSide(s)) return s;
  return null;
}
