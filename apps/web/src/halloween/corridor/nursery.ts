export const NURSERY = {
  chance: 0.5,
  creakAfterMs: 2600,
  crackAtMs: 1900,
  breakAtMs: 3700,
  fallMs: 2400,
  blackMs: 1700,
  holdMinMs: 12000,
  holdMaxMs: 25000,
  tvStareMs: 2500,
  emptyLookMs: 4000,
  backBlackMs: 700,
  trailMs: 2000,
  origin: { x: 0, y: -3200, z: 5600 },
  width: 1300,
  depth: 10800,
  height: 560,
  spawn: -5100,
  crib: 4900,
  tv: { x: -560, along: 1600 },
  margin: 70,
  leanWithin: 240,
  leanPitch: -0.7,
  leanRate: 0.9,
  peerPitch: -0.3,
} as const;

export type NurseryPhase =
  | "creaking"
  | "falling"
  | "dark"
  | "room"
  | "emptied"
  | "empty"
  | "sinking"
  | "dropping"
  | "back";

export type Crack = "creak" | "crack" | "break";

export function trapsOnPull(roll: number): boolean {
  return roll < NURSERY.chance;
}

export function crackDue(since: number, done: number): Crack | null {
  const marks: readonly [number, Crack][] = [
    [0, "creak"],
    [NURSERY.crackAtMs, "crack"],
    [NURSERY.breakAtMs, "break"],
  ];
  const next = marks[done];
  return next && since >= next[0] ? next[1] : null;
}

export function crackShake(since: number): number {
  const jolt = (at: number, size: number): number =>
    since >= at ? size * Math.exp(-(since - at) / 260) : 0;
  return jolt(0, 2.5) + jolt(NURSERY.crackAtMs, 6) + jolt(NURSERY.breakAtMs, 12);
}

export function fallDepth(since: number): number {
  const t = Math.max(0, Math.min(1, since / NURSERY.fallMs));
  return 60 * Math.min(1, t / 0.25) + 1400 * Math.max(0, (t - 0.25) / 0.75) ** 2.2;
}

export function fallFade(since: number): number {
  return Math.max(0, Math.min(1, (since / NURSERY.fallMs - 0.55) / 0.4));
}

export function insideRoom(x: number, along: number): boolean {
  const halfWidth = NURSERY.width / 2 - NURSERY.margin;
  const halfDepth = NURSERY.depth / 2 - NURSERY.margin;
  const inCrib = Math.abs(x) < 70 && Math.abs(along - NURSERY.crib) < 95;
  return Math.abs(x) <= halfWidth && Math.abs(along) <= halfDepth && !inCrib;
}

type Gaze = { x: number; distance: number; yaw: number; pitch: number };

function facing(walker: Gaze, x: number, along: number, within: number): boolean {
  const angle = Math.atan2(x - walker.x, along - walker.distance) - walker.yaw;
  return Math.abs(Math.atan2(Math.sin(angle), Math.cos(angle))) < within;
}

export function besideCrib(walker: Gaze): boolean {
  const near = Math.hypot(walker.x, NURSERY.crib - walker.distance) < NURSERY.leanWithin;
  return near && facing(walker, 0, NURSERY.crib, 0.9);
}

export function peersIntoCrib(walker: Gaze): boolean {
  return besideCrib(walker) && walker.pitch <= NURSERY.peerPitch;
}

export function leanOver(pitch: number, dt: number): number {
  return Math.max(NURSERY.leanPitch, pitch - NURSERY.leanRate * dt);
}

export function facesTv(walker: Gaze): boolean {
  return facing(walker, NURSERY.tv.x, NURSERY.tv.along, 0.35);
}

export function sinkDue(heldFor: number, staredFor: number): boolean {
  if (heldFor >= NURSERY.holdMaxMs) return true;
  return heldFor >= NURSERY.holdMinMs && staredFor >= NURSERY.tvStareMs;
}

export function cryingLevel(distanceToCrib: number): number {
  return Math.max(0.08, Math.min(1, 1.1 - distanceToCrib / 4200));
}
