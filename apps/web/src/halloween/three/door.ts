import { Group, Mesh, Object3D, SphereGeometry } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import type { CorridorMaterials } from "./materials";
import type { ModelTemplates } from "./models";
import { box, wallPiece } from "./pieces";
import { buildWatcherRoom, type RoomMaterials, type WatcherRoom } from "./watcher-room";

export type DoorHandle = WatcherRoom & { pivot: Object3D };
export type DoorFrame = { group: Group; pivot: Object3D };

const L = CORRIDOR.segmentLength;
const H = CORRIDOR.ceiling + CORRIDOR.floor;
const FLOOR = -CORRIDOR.floor;
const WALL_X = -CORRIDOR.width / 2;
export const DOORWAY = { near: 135, far: 285, height: 270 } as const;
const NEAR = DOORWAY.near;
const FAR = DOORWAY.far;
const DOOR_H = DOORWAY.height;
const AJAR = (40 * Math.PI) / 180;

function doorLeaf(materials: CorridorMaterials, open: number): Object3D {
  const pivot = new Object3D();
  const width = FAR - NEAR;
  const leaf = box(6, DOOR_H, width, materials.darkWood);
  leaf.position.set(0, FLOOR + DOOR_H / 2, -width / 2);
  const hingeFill = box(12, DOOR_H, 16, materials.darkWood);
  hingeFill.position.set(0, FLOOR + DOOR_H / 2, 6);
  pivot.add(leaf, hingeFill);
  for (const [y, z, h] of [
    [FLOOR + 190, -40, 110],
    [FLOOR + 190, -110, 110],
    [FLOOR + 70, -40, 90],
    [FLOOR + 70, -110, 90],
  ] as const) {
    const panel = box(4, h, 52, materials.darkWood);
    panel.position.set(4, y, z);
    pivot.add(panel);
  }
  const knob = new Mesh(new SphereGeometry(5, 16, 12), materials.gilt);
  knob.position.set(8, FLOOR + 125, -width + 14);
  knob.castShadow = true;
  pivot.add(knob);
  pivot.position.set(WALL_X, 0, -NEAR);
  pivot.rotation.y = open;
  return pivot;
}

export type WallSpan = { from: number; to: number };

export function buildDoorFrame(
  materials: CorridorMaterials,
  open: number,
  span: WallSpan = { from: 0, to: L },
): DoorFrame {
  const group = new Group();
  const y = (CORRIDOR.ceiling - CORRIDOR.floor) / 2;
  const nearPiece = wallPiece(
    NEAR - span.from,
    H,
    [span.from / L, NEAR / L],
    [0, 1],
    materials.wall,
  );
  nearPiece.rotation.y = Math.PI / 2;
  nearPiece.position.set(WALL_X, y, -(span.from + NEAR) / 2);
  const farPiece = wallPiece(span.to - FAR, H, [FAR / L, span.to / L], [0, 1], materials.wall);
  farPiece.rotation.y = Math.PI / 2;
  farPiece.position.set(WALL_X, y, -(FAR + span.to) / 2);
  const lintelH = H - DOOR_H;
  const lintel = wallPiece(
    FAR - NEAR,
    lintelH,
    [NEAR / L, FAR / L],
    [DOOR_H / H, 1],
    materials.wall,
  );
  lintel.rotation.y = Math.PI / 2;
  lintel.position.set(WALL_X, FLOOR + DOOR_H + lintelH / 2, -(NEAR + FAR) / 2);
  const jambNear = box(12, DOOR_H + 12, 12, materials.wood);
  jambNear.position.set(WALL_X + 4, FLOOR + (DOOR_H + 12) / 2, -NEAR + 6);
  const jambFar = box(12, DOOR_H + 12, 12, materials.wood);
  jambFar.position.set(WALL_X + 4, jambNear.position.y, -FAR - 6);
  const head = box(12, 12, FAR - NEAR + 24, materials.wood);
  head.position.set(WALL_X + 4, FLOOR + DOOR_H + 6, -(NEAR + FAR) / 2);
  const pivot = doorLeaf(materials, open);
  group.add(nearPiece, farPiece, lintel, jambNear, jambFar, head, pivot);
  return { group, pivot };
}

export function buildDoorWall(
  materials: CorridorMaterials,
  look: RoomMaterials,
  models: ModelTemplates,
): DoorHandle {
  const frame = buildDoorFrame(materials, AJAR);
  const room = buildWatcherRoom(materials, look, models);
  frame.group.add(room.group);
  return { ...room, group: frame.group, pivot: frame.pivot };
}
