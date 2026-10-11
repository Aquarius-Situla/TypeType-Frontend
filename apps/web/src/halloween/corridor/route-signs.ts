import { FIRST_DOOR, watcherDoorSide } from "./corridor-story";
import { STAIR_DOOR } from "./stairs-layout";

export type SignArrow = "ahead" | "left" | "right";

const EVERY_BEFORE_DOOR = 4;
const EVERY_AFTER_DOOR = 2;

export function routeSign(segment: number): SignArrow | null {
  if (segment < 1 || segment >= STAIR_DOOR) return null;
  if (segment === STAIR_DOOR - 1) return "ahead";
  const door = watcherDoorSide(segment);
  if (segment === FIRST_DOOR && door) return door;
  const every = segment < FIRST_DOOR ? EVERY_BEFORE_DOOR : EVERY_AFTER_DOOR;
  return segment % every === 1 ? "ahead" : null;
}
