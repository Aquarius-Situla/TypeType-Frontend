import { WALK } from "./corridor-config";

export type WalkInput = {
  forward: boolean;
  back: boolean;
  left: boolean;
  right: boolean;
  run: boolean;
};

export type Walker = {
  x: number;
  distance: number;
  speed: number;
  yaw: number;
  pitch: number;
  stridePhase: number;
};

export type StepEvent = {
  running: boolean;
  foot: -1 | 1;
  stairs?: boolean;
} | null;

export const NO_INPUT: WalkInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  run: false,
};

export function createWalker(): Walker {
  return { x: 0, distance: 0, speed: 0, yaw: 0, pitch: 0, stridePhase: 0 };
}

export type Look = { yaw: number; pitch: number };

export function stepWalker(
  walker: Walker,
  input: WalkInput,
  look: Look,
  dt: number,
  canStand: (x: number, distance: number) => boolean,
  pace = 1,
): { walker: Walker; step: StepEvent } {
  const axis = (input.forward ? 1 : 0) - (input.back ? 1 : 0);
  const side = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  const running = input.run && axis > 0;
  const target = axis * (running ? WALK.runSpeed : WALK.walkSpeed) * pace;
  const blend = 1 - Math.exp(-WALK.acceleration * dt);
  const speed = walker.speed + (target - walker.speed) * blend;
  const { yaw, pitch } = look;

  const forwardMove = speed * dt;
  const strafeMove = side * WALK.strafeSpeed * pace * dt;
  const dx = Math.sin(yaw) * forwardMove + Math.cos(yaw) * strafeMove;
  const dd = Math.cos(yaw) * forwardMove - Math.sin(yaw) * strafeMove;
  let x = walker.x;
  let distance = walker.distance;
  if (canStand(x + dx, distance + dd)) {
    x += dx;
    distance += dd;
  } else if (canStand(x + dx, distance)) {
    x += dx;
  } else if (canStand(x, distance + dd)) {
    distance += dd;
  }
  const travelled = Math.hypot(x - walker.x, distance - walker.distance);
  const stride = running ? WALK.runStride : WALK.walkStride;
  const stridePhase = walker.stridePhase + travelled / stride;
  const stepped = Math.floor(stridePhase) > Math.floor(walker.stridePhase);
  const foot: -1 | 1 = Math.floor(stridePhase) % 2 === 0 ? -1 : 1;
  return {
    walker: { x, distance, speed: travelled > 0 ? speed : 0, yaw, pitch, stridePhase },
    step: stepped ? { running: running || Math.abs(speed) > WALK.walkSpeed * 1.3, foot } : null,
  };
}

export function headBob(walker: Walker): number {
  const amplitude = Math.min(1, Math.abs(walker.speed) / WALK.walkSpeed) * 5;
  const dip = Math.abs(Math.sin(walker.stridePhase * Math.PI)) * amplitude;
  return dip === 0 ? 0 : -dip;
}
