import { CORRIDOR } from "./corridor-config";
import { watcherDoorSide } from "./corridor-story";
import { STAIR_DOOR } from "./stairs-layout";

export const ALARM = {
  z: 40,
  y: -20,
  reach: 190,
  facing: 0.7,
  sirenMs: 18800,
  pulseMs: 1100,
  blackMs: 2300,
  flickerMs: 700,
} as const;

export function hasFireAlarm(segment: number): boolean {
  return segment % 7 === 3 && segment < STAIR_DOOR && watcherDoorSide(segment) !== "right";
}

export function alarmPosition(segment: number): { x: number; z: number } {
  return { x: CORRIDOR.width / 2, z: -segment * CORRIDOR.segmentLength - ALARM.z };
}

export function alarmInReach(walker: { x: number; distance: number; yaw: number }): number | null {
  const near = Math.floor((walker.distance + ALARM.z) / CORRIDOR.segmentLength);
  for (const segment of [near - 1, near, near + 1]) {
    if (segment < 0 || !hasFireAlarm(segment)) continue;
    const at = alarmPosition(segment);
    const dx = at.x - walker.x;
    const dz = at.z + walker.distance;
    if (Math.hypot(dx, dz) > ALARM.reach) continue;
    const angle = Math.atan2(dx, -dz) - walker.yaw;
    if (Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < ALARM.facing) return segment;
  }
  return null;
}

export type AlarmFrame = {
  red: number;
  lamp: number;
  siren: boolean;
  done: boolean;
};

export function alarmFrame(since: number): AlarmFrame {
  if (since < ALARM.sirenMs) {
    const pulse = 0.5 - 0.5 * Math.cos((2 * Math.PI * since) / ALARM.pulseMs);
    const fadeIn = Math.min(1, since / 400);
    return { red: pulse * fadeIn, lamp: 1, siren: true, done: false };
  }
  const back = since - ALARM.sirenMs - ALARM.blackMs;
  if (back < 0) return { red: 0, lamp: 0, siren: false, done: false };
  if (back < ALARM.flickerMs) {
    const flicker = [0.6, 0, 0.3, 0, 1, 0.2, 1];
    const step = Math.floor((back / ALARM.flickerMs) * flicker.length);
    return { red: 0, lamp: flicker[step] ?? 1, siren: false, done: false };
  }
  return { red: 0, lamp: 1, siren: false, done: true };
}
