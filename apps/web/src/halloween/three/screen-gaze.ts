import { CORRIDOR } from "../corridor/corridor-config";
import { DESCENT_TURN } from "../corridor/descent-frame";
import { nearestTurn } from "../corridor/finale";
import { BOTTOM_DROP, HALL, PLATFORM_X } from "../corridor/stairs-layout";
import type { Look } from "../corridor/walker";

const SCREEN_Y = -CORRIDOR.floor - BOTTOM_DROP + HALL.screenLift;

export function gazeAtScreen(
  held: Look,
  move: { inner: { x: number }; eye: { y: number } },
  recentre: number,
): Look {
  const ahead = PLATFORM_X + HALL.screenRadius - move.inner.x;
  const yaw = nearestTurn(held.yaw, Math.PI / 2 - DESCENT_TURN);
  const pitch = Math.atan2(SCREEN_Y - move.eye.y, ahead);
  return {
    yaw: held.yaw + (yaw - held.yaw) * recentre,
    pitch: held.pitch + (pitch - held.pitch) * recentre,
  };
}
