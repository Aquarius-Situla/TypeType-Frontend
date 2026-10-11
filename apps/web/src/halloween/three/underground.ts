import { Group, type Material, type Scene, type Texture, type WebGLRenderer } from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import { DESCENT_ORIGIN, DESCENT_TURN, toDescent } from "../corridor/descent-frame";
import type { FinaleFrame } from "../corridor/finale";
import { STAIR_DOOR } from "../corridor/stairs-layout";
import { createExitSign } from "./exit-sign";
import { buildHall, disposeHall } from "./hall";
import { createHallAbyss } from "./hall-abyss";
import { createHallScreen } from "./hall-screen";
import type { CorridorMaterials } from "./materials";
import type { ModelTemplates } from "./models";
import { createNurseryRoom, type NurseryView } from "./nursery-room";
import { createSeal } from "./seal";
import { buildStairDoor } from "./stair-door";
import { createStairs } from "./stairs";

type UndergroundState = {
  eye: { x: number; y: number; z: number };
  now: number;
  stairDoor: number;
  sealed: boolean;
  screen: number | null;
  finale: FinaleFrame | null;
  nursery: NurseryView | null;
};

export type Underground = {
  update: (state: UndergroundState) => void;
  renderFeed: (renderer: WebGLRenderer) => void;
  prewarm: (renderer: WebGLRenderer) => void;
  dispose: () => void;
};

const L = CORRIDOR.segmentLength;
const W = CORRIDOR.width;
const DOOR_OPEN = (88 * Math.PI) / 180;

export function createUnderground(
  scene: Scene,
  models: ModelTemplates,
  materials: CorridorMaterials,
  dark: Material,
  face: Texture,
): Underground {
  const root = new Group();
  root.rotation.y = DESCENT_TURN;
  root.position.set(DESCENT_ORIGIN.x, 0, DESCENT_ORIGIN.z);
  const door = buildStairDoor(materials, { from: (L - W) / 2, to: (L + W) / 2 });
  door.group.scale.x = -1;
  door.group.position.z = -STAIR_DOOR * L;
  const stairs = createStairs(models.stairs, materials);
  stairs.update(0);
  const seal = createSeal(models.rock, dark, materials.bedrock);
  const hall = buildHall(materials);
  const sign = createExitSign(root, models.exitLight);
  const screen = createHallScreen(root, models.head);
  const abyss = createHallAbyss();
  const nursery = createNurseryRoom(scene, models, materials, face);
  root.add(door.group, stairs.group, seal.group, hall, sign.group, screen.group, abyss.group);
  scene.add(root);

  return {
    update(state) {
      stairs.update(toDescent(state.eye.x, -state.eye.z).x);
      door.pivot.rotation.y = DOOR_OPEN * state.stairDoor;
      if (state.sealed) seal.start(state.now);
      seal.update(state.now);
      sign.update(state.now);
      screen.update(state.screen, state.now, state.finale);
      nursery.update(state.nursery, state.now);
    },
    renderFeed(renderer) {
      screen.renderFeed(renderer);
    },
    prewarm(renderer) {
      screen.warm(renderer);
    },
    dispose() {
      stairs.dispose();
      seal.dispose();
      disposeHall(hall);
      sign.dispose();
      screen.dispose();
      abyss.dispose();
      nursery.dispose();
      root.removeFromParent();
    },
  };
}
