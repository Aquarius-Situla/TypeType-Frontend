import { Group, Mesh } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { galleryItem } from "../corridor/corridor-gallery";
import { type Side, watcherDoorSide } from "../corridor/corridor-story";
import { ALARM, hasFireAlarm } from "../corridor/fire-alarm";
import { routeSign } from "../corridor/route-signs";
import { type AlarmBeacons, beaconZ } from "./alarm-beacons";
import { buildDoorWall, type DoorHandle } from "./door";
import type { ExitArrows } from "./exit-arrows";
import { buildFrame } from "./frame";
import type { CorridorMaterials } from "./materials";
import { instance, type ModelTemplates } from "./models";
import { box, wallPiece } from "./pieces";
import type { RoomMaterials } from "./watcher-room";

export type Segment = {
  index: number;
  group: Group;
  door: DoorHandle | null;
};
export type SegmentKit = {
  materials: CorridorMaterials;
  models: ModelTemplates;
  room: RoomMaterials;
  signs: ExitArrows;
  beacons: AlarmBeacons;
  chalk: Mesh;
};

const L = CORRIDOR.segmentLength;
const W = CORRIDOR.width;
const H = CORRIDOR.ceiling + CORRIDOR.floor;
const FLOOR = -CORRIDOR.floor;
const RAIL_Y = FLOOR + 68;
const FRAME_Y = 30;
const SIGN_Z = 30;

function side(
  index: number,
  which: Side,
  kit: SegmentKit,
): { group: Group; door: DoorHandle | null } {
  const group = new Group();
  const sign = which === "left" ? -1 : 1;
  const wallX = (sign * W) / 2;
  const facing = which === "left" ? Math.PI / 2 : -Math.PI / 2;
  const place = (
    object: Group | Mesh | ReturnType<typeof instance>,
    inset: number,
    y: number,
    z: number,
  ): void => {
    object.rotation.y = facing;
    object.position.set(wallX - sign * inset, y, z);
    group.add(object);
  };
  let door: DoorHandle | null = null;
  if (watcherDoorSide(index) === which) {
    door = buildDoorWall(kit.materials, kit.room, kit.models);
    if (which === "right") door.group.scale.x = -1;
    group.add(door.group);
  } else {
    place(
      wallPiece(L, H, [0, 1], [0, 1], kit.materials.wall),
      0,
      (CORRIDOR.ceiling - CORRIDOR.floor) / 2,
      -L / 2,
    );
    const painting = galleryItem(index, which);
    if (index === 0 && which === "left") place(kit.chalk, 0.6, -10, -L + 20);
    else if (painting) place(buildFrame(painting, kit.materials, kit.models), 2, FRAME_Y, -L / 2);
    place(box(L, 7, 5, kit.materials.wood), 2.5, RAIL_Y, -L / 2);
    if (which === "right" && hasFireAlarm(index))
      place(instance(kit.models.fireAlarm, 1), 0.5, ALARM.y, -ALARM.z);
    if (which === "left" && index % 11 === 5)
      place(instance(kit.models.clock, 1), 0.5, 135, -L + 40);
  }
  place(box(L, 22, 4, kit.materials.darkWood), 2, FLOOR + 11, -L / 2);
  return { group, door };
}

export function buildSegment(index: number, kit: SegmentKit): Segment {
  const group = new Group();
  group.position.z = -index * L;
  const left = side(index, "left", kit);
  const right = side(index, "right", kit);
  const floor = wallPiece(W, L, [0, 1], [0, 1], kit.materials.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, FLOOR, -L / 2);
  floor.castShadow = false;
  const ceiling = wallPiece(W, L, [0, 1], [0, 1], kit.materials.ceiling);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(0, CORRIDOR.ceiling, -L / 2);
  const tube = instance(kit.models.fluorescent, 1.35);
  tube.rotation.y = Math.PI / 2;
  tube.position.set(0, CORRIDOR.ceiling, -L / 2);
  group.add(left.group, right.group, floor, ceiling, tube);
  const beacon = kit.beacons.build();
  beacon.position.set(0, CORRIDOR.ceiling, beaconZ(index) + index * L);
  group.add(beacon);
  const arrow = routeSign(index);
  if (arrow) {
    const sign = kit.signs.build(arrow);
    sign.position.z = -SIGN_Z;
    group.add(sign);
  }
  return { index, group, door: left.door ?? right.door };
}

export function disposeSegment(segment: Segment): void {
  segment.group.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (object.geometry.userData.shared !== true) object.geometry.dispose();
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (material.userData.shared !== true) material.dispose();
    }
  });
  segment.group.removeFromParent();
}
