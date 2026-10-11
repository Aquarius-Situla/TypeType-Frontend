import { WALK } from "./corridor-config";
import type { PeekSpot } from "./corridor-story";
import { END_DISTANCE } from "./descent-frame";
import { type Look, NO_INPUT, type Walker, type WalkInput } from "./walker";

export const GUIDE = {
  reach: 4,
  settleWithin: 45,
  turnRate: 2.6,
  pitchRate: 1.2,
  walkWhenWithin: 0.45,
} as const;

export function guideWanted(distance: number, watcherSeen: boolean): boolean {
  const atWall = distance >= END_DISTANCE - WALK.wallMargin - GUIDE.reach;
  return !watcherSeen && atWall && distance <= END_DISTANCE;
}

function turnToward(from: number, to: number, step: number): number {
  const gap = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + Math.max(-step, Math.min(step, gap));
}

export type Steering = { input: WalkInput; look: Look; settling: boolean };

export function steer(
  walker: Walker,
  look: Look,
  spot: PeekSpot,
  settling: boolean,
  dt: number,
): Steering {
  const dx = spot.x - walker.x;
  const dd = spot.distance - walker.distance;
  const settle = settling || Math.hypot(dx, dd) <= GUIDE.settleWithin;
  const heading = settle ? spot.yaw : Math.atan2(dx, dd);
  const yaw = turnToward(look.yaw, heading, GUIDE.turnRate * dt);
  const aim = settle ? spot.pitch : 0;
  const pitch = turnToward(look.pitch, aim, GUIDE.pitchRate * dt);
  const lined = Math.abs(Math.atan2(Math.sin(heading - yaw), Math.cos(heading - yaw)));
  const forward = !settle && lined < GUIDE.walkWhenWithin;
  return { input: { ...NO_INPUT, forward }, look: { yaw, pitch }, settling: settle };
}
