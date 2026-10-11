import { Mesh, type PerspectiveCamera, type Scene, Texture, type WebGLRenderer } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { FIRST_DOOR } from "../corridor/corridor-story";
import { descentPoint, END_DISTANCE } from "../corridor/descent-frame";
import {
  BOTTOM_DROP,
  HALL,
  PLATFORM_X,
  STAIR_DOOR,
  STAIRS,
  STAIRS_TOP_X,
} from "../corridor/stairs-layout";
import { watcherFrame } from "../corridor/watcher-scene";
import type { RoomLook } from "./room-look";
import { buildSegment, disposeSegment, type SegmentKit } from "./segment";

type Point = { x: number; y: number; z: number };

export function prewarm(
  renderer: WebGLRenderer,
  scene: Scene,
  camera: PerspectiveCamera,
  kit: SegmentKit,
  room: RoomLook,
): void {
  const warm = [buildSegment(FIRST_DOOR, kit), buildSegment(STAIR_DOOR - 1, kit)];
  for (const segment of warm) scene.add(segment.group);
  room.prewarm(renderer);
  for (const segment of warm) {
    segment.group.traverse((object) => {
      if (!(object instanceof Mesh)) return;
      const list = Array.isArray(object.material) ? object.material : [object.material];
      for (const material of list) {
        for (const value of Object.values(material)) {
          if (value instanceof Texture) renderer.initTexture(value);
        }
      }
    });
  }
  room.apply(warm[0]?.door ?? null, { frame: watcherFrame(null, 0), slammed: false, now: 0 });
  renderer.compile(scene, camera);
  const view = camera.clone();
  const look = (from: Point, to: Point): void => {
    view.position.set(from.x, from.y, from.z);
    view.lookAt(to.x, to.y, to.z);
    view.updateMatrixWorld();
    renderer.render(scene, view);
  };
  const watcherZ = -(FIRST_DOOR * CORRIDOR.segmentLength + CORRIDOR.segmentLength / 2);
  look({ x: 0, y: 0, z: watcherZ + 150 }, { x: -CORRIDOR.width, y: -60, z: watcherZ - 150 });
  look({ x: 0, y: 0, z: 150 - END_DISTANCE }, { x: 0, y: -60, z: -END_DISTANCE });
  look(
    descentPoint(STAIRS_TOP_X - 60, 0, STAIRS.doorZ),
    descentPoint(STAIRS_TOP_X + 600, -400, STAIRS.doorZ),
  );
  look(
    descentPoint(HALL.doorwayX - 200, -BOTTOM_DROP, STAIRS.doorZ),
    descentPoint(PLATFORM_X, -BOTTOM_DROP, STAIRS.doorZ),
  );
  renderer.render(scene, camera);
  for (const segment of warm) disposeSegment(segment);
}
