import {
  BoxGeometry,
  type BufferGeometry,
  ExtrudeGeometry,
  Group,
  type Material,
  Mesh,
  PlaneGeometry,
  Shape,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import {
  BOTTOM_DROP,
  DECK_DROP,
  DECK_X,
  deckHalfWidth,
  HALL,
  STAIRS,
  STAIRS_BOTTOM_X,
  STEPS_X,
} from "../corridor/stairs-layout";
import { barriers } from "./hall-barriers";
import type { CorridorMaterials } from "./materials";

const BOTTOM = -CORRIDOR.floor - BOTTOM_DROP;
const DECK = -CORRIDOR.floor - DECK_DROP;
const Z = STAIRS.doorZ;
const FAR = 3000;
const TILE = 120;

function tiled<T extends BufferGeometry>(geometry: T, u: number, v: number): T {
  const uv = geometry.getAttribute("uv");
  for (let i = 0; i < uv.count; i += 1) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  return geometry;
}

function slab(width: number, height: number, depth: number, material: Material): Mesh {
  const geometry = tiled(new BoxGeometry(width, height, depth), width / TILE, depth / TILE);
  const mesh = new Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function walkway(from: number, length: number, top: number, materials: CorridorMaterials): Group {
  const group = new Group();
  const deck = slab(length, 8, HALL.walkwayWidth, materials.plate);
  deck.position.set(from + length / 2, top - 4, Z);
  const girder = slab(length, 60, HALL.walkwayWidth * 0.45, materials.rail);
  girder.position.set(from + length / 2, top - 38, Z);
  group.add(deck, girder);
  for (const side of [-1, 1]) {
    const kerb = slab(length, 9, 7, materials.rail);
    kerb.position.set(from + length / 2, top + 4, Z + side * (HALL.walkwayWidth / 2 - 3.5));
    group.add(kerb);
  }
  return group;
}

function deck(materials: CorridorMaterials): Mesh {
  const shape = new Shape();
  const far = DECK_X + HALL.deckLength;
  shape.moveTo(DECK_X, -deckHalfWidth(DECK_X));
  shape.lineTo(far, -deckHalfWidth(far));
  shape.lineTo(far, deckHalfWidth(far));
  shape.lineTo(DECK_X, deckHalfWidth(DECK_X));
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, {
    depth: 14,
    bevelEnabled: true,
    bevelSize: 3,
    bevelThickness: 3,
    bevelSegments: 1,
  });
  tiled(geometry, 1 / TILE, 1 / TILE);
  geometry.rotateX(Math.PI / 2);
  const mesh = new Mesh(geometry, materials.plate);
  mesh.position.set(0, DECK, Z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

export function buildHall(materials: CorridorMaterials): Group {
  const group = new Group();
  const landingLength = HALL.doorwayX - STAIRS_BOTTOM_X;
  const landingX = STAIRS_BOTTOM_X + landingLength / 2;
  const landing = slab(landingLength + 10, 30, STAIRS.width, materials.stone);
  landing.position.set(landingX, BOTTOM - 15, Z);
  const ceiling = new Mesh(new PlaneGeometry(landingLength + 10, STAIRS.width), materials.shaft);
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(landingX, BOTTOM + STAIRS.headroom, Z);
  group.add(landing, ceiling);
  for (const side of [-1, 1]) {
    const wall = new Mesh(
      new PlaneGeometry(landingLength + 10, STAIRS.headroom + 40),
      materials.shaft,
    );
    wall.rotation.y = side > 0 ? Math.PI : 0;
    wall.position.set(landingX, BOTTOM + STAIRS.headroom / 2 - 20, Z + (side * STAIRS.width) / 2);
    group.add(wall);
  }

  const doorHalf = STAIRS.width / 2;
  const above = slab(20, FAR, FAR * 2, materials.shaft);
  above.position.set(HALL.doorwayX, BOTTOM + STAIRS.headroom + FAR / 2, Z);
  const below = slab(20, FAR, FAR * 2, materials.shaft);
  below.position.set(HALL.doorwayX, BOTTOM - FAR / 2, Z);
  group.add(above, below);
  for (const side of [-1, 1]) {
    const wing = slab(20, STAIRS.headroom, FAR - doorHalf, materials.shaft);
    wing.position.set(
      HALL.doorwayX,
      BOTTOM + STAIRS.headroom / 2,
      Z + side * (doorHalf + (FAR - doorHalf) / 2),
    );
    group.add(wing);
  }

  group.add(walkway(HALL.doorwayX, HALL.walkwayLength, BOTTOM, materials));
  for (let i = 0; i < HALL.steps; i += 1) {
    const top = BOTTOM - (i + 1) * HALL.stepRise;
    const step = slab(HALL.stepRun + 2, 12, HALL.walkwayWidth, materials.plate);
    step.position.set(STEPS_X + (i + 0.5) * HALL.stepRun, top - 6, Z);
    group.add(step);
  }
  group.add(deck(materials), barriers(materials));
  return group;
}

export function disposeHall(group: Group): void {
  group.traverse((object) => {
    if (!(object instanceof Mesh)) return;
    if (object.geometry.userData.shared !== true) object.geometry.dispose();
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) if (material.userData.shared !== true) material.dispose();
  });
  group.removeFromParent();
}
