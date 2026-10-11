import { BoxGeometry, Group, type Material, Mesh, Vector3 } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import {
  BOTTOM_DROP,
  DECK_DROP,
  DECK_X,
  deckHalfWidth,
  HALL,
  STAIRS,
  STEPS_X,
} from "../corridor/stairs-layout";
import type { CorridorMaterials } from "./materials";

const BOTTOM = -CORRIDOR.floor - BOTTOM_DROP;
const DECK = -CORRIDOR.floor - DECK_DROP;
const Z = STAIRS.doorZ;
const RAIL_HEIGHT = 100;
const POST_EVERY = 160;

function barrier(from: Vector3, to: Vector3, material: Material): Group {
  const group = new Group();
  const run = to.clone().sub(from);
  const length = run.length();
  const angle = Math.atan2(-run.z, run.x);
  const middle = from.clone().add(to).multiplyScalar(0.5);
  for (const [height, thickness] of [
    [RAIL_HEIGHT, 5],
    [RAIL_HEIGHT * 0.5, 3],
  ] as const) {
    const rail = new Mesh(new BoxGeometry(length + thickness, thickness, thickness), material);
    rail.position.set(middle.x, from.y + height, middle.z);
    rail.rotation.y = angle;
    rail.castShadow = true;
    group.add(rail);
  }
  const posts = Math.max(1, Math.round(length / POST_EVERY));
  for (let i = 0; i <= posts; i += 1) {
    const at = from.clone().lerp(to, i / posts);
    const post = new Mesh(new BoxGeometry(5, RAIL_HEIGHT, 5), material);
    post.position.set(at.x, from.y + RAIL_HEIGHT / 2, at.z);
    post.castShadow = true;
    group.add(post);
  }
  return group;
}

export function barriers(materials: CorridorMaterials): Group {
  const group = new Group();
  const edge = HALL.walkwayWidth / 2 - 4;
  const far = DECK_X + HALL.deckLength - 4;
  for (const side of [-1, 1]) {
    const z = (half: number): number => Z + side * half;
    group.add(
      barrier(
        new Vector3(HALL.doorwayX + 20, BOTTOM, z(edge)),
        new Vector3(STEPS_X, BOTTOM, z(edge)),
        materials.rail,
      ),
      barrier(
        new Vector3(DECK_X, DECK, z(deckHalfWidth(DECK_X) - 4)),
        new Vector3(far, DECK, z(deckHalfWidth(far) - 4)),
        materials.rail,
      ),
    );
    for (let i = 0; i < HALL.steps; i += 1) {
      const top = BOTTOM - (i + 1) * HALL.stepRise;
      const x = STEPS_X + i * HALL.stepRun;
      group.add(
        barrier(
          new Vector3(x, top, z(edge)),
          new Vector3(x + HALL.stepRun, top, z(edge)),
          materials.rail,
        ),
      );
    }
  }
  group.add(
    barrier(
      new Vector3(far, DECK, Z - deckHalfWidth(far) + 4),
      new Vector3(far, DECK, Z + deckHalfWidth(far) - 4),
      materials.rail,
    ),
  );
  return group;
}
