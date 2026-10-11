import { Group } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { STAIRS } from "../corridor/stairs-layout";
import { buildDoorFrame, DOORWAY, type DoorFrame, type WallSpan } from "./door";
import type { CorridorMaterials } from "./materials";
import { wallPiece } from "./pieces";

const FLOOR = -CORRIDOR.floor;
const WALL_X = -CORRIDOR.width / 2;
const DEPTH = STAIRS.passage;
const SIDE = 18;
const NEAR = DOORWAY.near - 4;
const FAR = DOORWAY.far + SIDE;
const WIDTH = FAR - NEAR;
const HEIGHT = DOORWAY.height + 12;

export function buildStairDoor(materials: CorridorMaterials, span: WallSpan): DoorFrame {
  const frame = buildDoorFrame(materials, 0, span);
  const passage = new Group();
  const mid = WALL_X - DEPTH / 2;
  const floor = wallPiece(DEPTH, WIDTH, [0, 1.2], [0, 1], materials.stone);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(mid, FLOOR, -(NEAR + FAR) / 2);
  const ceiling = wallPiece(DEPTH, WIDTH, [0, 1.2], [0, 1], materials.shaft);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(mid, FLOOR + HEIGHT, floor.position.z);
  const near = wallPiece(DEPTH, HEIGHT, [0, 0.5], [0, 0.8], materials.shaft);
  near.rotation.y = Math.PI;
  near.position.set(mid, FLOOR + HEIGHT / 2, -NEAR);
  const far = wallPiece(DEPTH, HEIGHT, [0, 0.5], [0, 0.8], materials.shaft);
  far.position.set(mid, FLOOR + HEIGHT / 2, -FAR);
  passage.add(floor, ceiling, near, far);
  frame.group.add(passage);
  return frame;
}
