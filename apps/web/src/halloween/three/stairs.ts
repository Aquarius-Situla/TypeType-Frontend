import { CylinderGeometry, Group, Mesh, type Object3D, PlaneGeometry } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { FLIGHTS, STAIRS, STAIRS_TOP_X } from "../corridor/stairs-layout";
import type { CorridorMaterials } from "./materials";

export type Stairs = {
  group: Group;
  update: (x: number) => void;
  dispose: () => void;
};

const FLOOR = -CORRIDOR.floor;
const RUN = STAIRS.flightRun;
const DROP = STAIRS.flightDrop;
const WIDTH = STAIRS.width;
const HEADROOM = STAIRS.headroom;
const MODEL = { run: 130.13, drop: 124, width: 40.44, left: -0.127, zMid: -17.26 };
const SLOPE = Math.atan2(DROP, RUN);
const WALL_HEIGHT = DROP + HEADROOM + 40;

type Shared = {
  wall: PlaneGeometry;
  sloped: PlaneGeometry;
  rail: CylinderGeometry;
};

function shared(): Shared {
  const parts = {
    wall: new PlaneGeometry(RUN, WALL_HEIGHT),
    sloped: new PlaneGeometry(Math.hypot(RUN, DROP), WIDTH),
    rail: new CylinderGeometry(2.2, 2.2, Math.hypot(RUN, DROP), 8),
  };
  for (const geometry of Object.values(parts)) geometry.userData.shared = true;
  return parts;
}

function flight(index: number, model: Group, parts: Shared, materials: CorridorMaterials): Group {
  const group = new Group();
  const x0 = STAIRS_TOP_X + index * RUN;
  const top = FLOOR - index * DROP;
  const steps = model.clone(true);
  steps.scale.set(RUN / MODEL.run, DROP / MODEL.drop, WIDTH / MODEL.width);
  steps.position.set(
    x0 - MODEL.left * steps.scale.x,
    top - DROP,
    STAIRS.doorZ - MODEL.zMid * steps.scale.z,
  );
  group.add(steps);

  for (const side of [-1, 1]) {
    const wall = new Mesh(parts.wall, materials.shaft);
    wall.position.set(
      x0 + RUN / 2,
      top + HEADROOM - WALL_HEIGHT / 2,
      STAIRS.doorZ + (side * WIDTH) / 2,
    );
    wall.rotation.y = side > 0 ? Math.PI : 0;
    wall.receiveShadow = true;
    group.add(wall);
  }
  const sloped = new Mesh(parts.sloped, materials.shaft);
  sloped.rotation.order = "ZYX";
  sloped.rotation.set(Math.PI / 2, 0, -SLOPE);
  sloped.position.set(x0 + RUN / 2, top - DROP / 2 + HEADROOM, STAIRS.doorZ);
  group.add(sloped);

  const railZ = STAIRS.doorZ - WIDTH / 2 + 7;
  const rail = new Mesh(parts.rail, materials.rail);
  rail.rotation.z = Math.PI / 2 - SLOPE;
  rail.position.set(x0 + RUN / 2, top - DROP / 2 + 92, railZ);
  group.add(rail);
  return group;
}

export function createStairs(model: Group, materials: CorridorMaterials): Stairs {
  const parts = shared();
  const group = new Group();
  const flights = new Map<number, Object3D>();

  return {
    group,
    update(x) {
      const current = Math.floor((x - STAIRS_TOP_X) / RUN);
      const wanted = new Set(
        [-3, -2, -1, 0, 1, 2, 3].map((k) => current + k).filter((k) => k >= 0 && k < FLIGHTS),
      );
      for (const [index, built] of flights) {
        if (wanted.has(index)) continue;
        built.removeFromParent();
        flights.delete(index);
      }
      for (const index of wanted) {
        if (flights.has(index)) continue;
        const built = flight(index, model, parts, materials);
        flights.set(index, built);
        group.add(built);
      }
    },
    dispose() {
      for (const geometry of Object.values(parts)) geometry.dispose();
      group.removeFromParent();
    },
  };
}
