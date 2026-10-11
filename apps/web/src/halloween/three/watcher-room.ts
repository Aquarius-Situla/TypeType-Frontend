import {
  Group,
  Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  Object3D,
  PlaneGeometry,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { buildBlanket } from "./blanket";
import type { CorridorMaterials } from "./materials";
import { instance, type ModelTemplates } from "./models";
import { box, wallPiece } from "./pieces";

export type RoomMaterials = {
  screen: MeshBasicMaterial;
  watcher: MeshStandardMaterial;
  blanket: MeshStandardMaterial;
};

export type WatcherRoom = {
  group: Group;
  lightFrom: Object3D;
  lightTo: Object3D;
  watcher: Object3D;
  screen: Mesh;
};

const H = CORRIDOR.ceiling + CORRIDOR.floor;
const FLOOR = -CORRIDOR.floor;
const WALL_X = -CORRIDOR.width / 2;
const ROOM_DEPTH = 470;
const ROOM_LENGTH = 900;
const GAP = { x: WALL_X, z: -268 };
const SEAT = { x: WALL_X - 122, z: -377 };
const FACING = { x: -0.649, z: -0.761 };
const TV_DISTANCE = 270;
const HEAD_SCALE = 5.75;
const CHAIR_SCALE = 0.92;
const CROWN_Y = FLOOR + 162;

function shell(materials: CorridorMaterials): Mesh[] {
  const y = (CORRIDOR.ceiling - CORRIDOR.floor) / 2;
  const back = wallPiece(ROOM_LENGTH, H, [0, 1], [0, 1], materials.roomWall);
  back.rotation.y = Math.PI / 2;
  back.position.set(WALL_X - ROOM_DEPTH, y, -ROOM_LENGTH / 2);
  const sideNear = wallPiece(ROOM_DEPTH, H, [0, 0.5], [0, 1], materials.roomWall);
  sideNear.rotation.y = Math.PI;
  sideNear.position.set(WALL_X - ROOM_DEPTH / 2, y, 0);
  const sideFar = wallPiece(ROOM_DEPTH, H, [0, 0.5], [0, 1], materials.roomWall);
  sideFar.position.set(WALL_X - ROOM_DEPTH / 2, y, -ROOM_LENGTH);
  const floor = wallPiece(ROOM_DEPTH, ROOM_LENGTH, [0, 2], [0, 4], materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(WALL_X - ROOM_DEPTH / 2, FLOOR, -ROOM_LENGTH / 2);
  const ceiling = wallPiece(ROOM_DEPTH, ROOM_LENGTH, [0, 1], [0, 2], materials.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(floor.position.x, CORRIDOR.ceiling, floor.position.z);
  return [back, sideNear, sideFar, floor, ceiling];
}

function watcher(look: RoomMaterials, models: ModelTemplates): Object3D {
  const figure = new Group();
  const head = new Mesh(models.head.geometry, look.watcher);
  head.scale.setScalar(HEAD_SCALE);
  head.position.set(0, CROWN_Y - 4 * HEAD_SCALE, 0.45 * HEAD_SCALE);
  head.castShadow = true;
  const collar = head.position.y - 1.55 * HEAD_SCALE;
  const blanket = buildBlanket(look.blanket, collar, FLOOR + 50);
  figure.add(head, blanket);
  return figure;
}

export function buildWatcherRoom(
  materials: CorridorMaterials,
  look: RoomMaterials,
  models: ModelTemplates,
): WatcherRoom {
  const group = new Group();
  const yaw = Math.atan2(FACING.x, FACING.z);
  const figure = watcher(look, models);
  figure.position.set(SEAT.x, 0, SEAT.z);
  figure.rotation.y = yaw;
  const chair = instance(models.armchair, CHAIR_SCALE);
  chair.position.set(SEAT.x + FACING.x * 23, FLOOR, SEAT.z + FACING.z * 23);
  chair.rotation.y = yaw;

  const tvAt = { x: SEAT.x + FACING.x * TV_DISTANCE, z: SEAT.z + FACING.z * TV_DISTANCE };
  const stand = box(72, 78, 44, materials.darkWood);
  stand.position.set(tvAt.x, FLOOR + 39, tvAt.z);
  stand.rotation.y = yaw;
  const television = instance(models.television, 1);
  television.position.set(tvAt.x, FLOOR + 78, tvAt.z);
  television.rotation.y = yaw + Math.PI;
  const screen = new Mesh(new PlaneGeometry(0.31, 0.25), look.screen);
  screen.position.set(0, 0.254, 0.126);
  const lightFrom = new Object3D();
  lightFrom.position.set(0, 0.254, 0.4);
  television.add(screen, lightFrom);
  const lightTo = new Object3D();
  lightTo.position.set(GAP.x + 120, FLOOR, GAP.z + 60);

  group.add(...shell(materials), chair, figure, stand, television, lightTo);
  return { group, lightFrom, lightTo, watcher: figure, screen };
}
