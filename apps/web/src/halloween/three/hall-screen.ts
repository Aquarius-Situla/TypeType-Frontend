import {
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  type Object3D,
  SpotLight,
  type WebGLRenderer,
} from "three";
import { CORRIDOR } from "../corridor/corridor-config";
import type { FinaleFrame } from "../corridor/finale";
import { BOTTOM_DROP, HALL, PLATFORM_X, STAIRS } from "../corridor/stairs-layout";
import { arc, screenPower } from "./hall-screen-parts";
import type { HeadScan } from "./models";
import { createScreenFace } from "./screen-face";

export type HallScreen = {
  group: Group;
  update: (since: number | null, now: number, finale: FinaleFrame | null) => void;
  renderFeed: (renderer: WebGLRenderer) => void;
  warm: (renderer: WebGLRenderer) => void;
  dispose: () => void;
};

const BOTTOM = -CORRIDOR.floor - BOTTOM_DROP;
const R = HALL.screenRadius;
const H = HALL.screenHeight;
const MID = Math.PI / 2;
const HALF = HALL.screenArc / 2;
const CENTRE_Y = BOTTOM + HALL.screenLift;
const LIGHT = 26000;

export function createHallScreen(parent: Object3D, head: HeadScan): HallScreen {
  const group = new Group();
  group.position.set(PLATFORM_X, CENTRE_Y, STAIRS.doorZ);
  const bezel = new MeshBasicMaterial({ color: 0x050606, fog: false, side: DoubleSide });
  const back = new Mesh(arc(R, H, MID - HALF, MID + HALF), bezel);
  const face = createScreenFace(head);
  group.add(back, face.mesh);

  const light = new SpotLight(0xc6d6ff, 0, 7000, 1.0, 0.7, 1);
  light.position.set(PLATFORM_X + R - 200, BOTTOM + 500, STAIRS.doorZ);
  light.target.position.set(HALL.doorwayX + HALL.walkwayLength * 0.4, BOTTOM, STAIRS.doorZ);
  parent.add(light, light.target);

  return {
    group,
    update(since, now, finale) {
      const power = screenPower(since);
      const snow = power * (finale?.snow ?? 1);
      const reveal = finale?.face ?? 0;
      face.update(snow, reveal, finale?.meme ?? null, now);
      const flicker = 0.8 + Math.random() * 0.2;
      light.intensity = LIGHT * Math.max(snow * 0.55 * flicker, reveal * 0.25 * power);
    },
    renderFeed(renderer) {
      face.render(renderer);
    },
    warm(renderer) {
      face.warm(renderer);
    },
    dispose() {
      parent.remove(light, light.target);
      light.dispose();
      back.geometry.dispose();
      bezel.dispose();
      face.dispose();
      group.removeFromParent();
    },
  };
}
