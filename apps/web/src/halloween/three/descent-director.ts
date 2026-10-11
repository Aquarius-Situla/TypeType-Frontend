import type { RefObject } from "react";
import { corridorCamera } from "../corridor/corridor-camera";
import { FIRST_DOOR } from "../corridor/corridor-story";
import { doorOpening, doorShouldOpen } from "../corridor/descent";
import { END_DISTANCE, toDescent, walkable } from "../corridor/descent-frame";
import { FINALE, FINALE_X } from "../corridor/finale";
import {
  HALL,
  SCREEN_X,
  SEAL_RISE_MS,
  SEAL_X,
  STAIRS,
  STAIRS_TOP_X,
  stairsDrop,
} from "../corridor/stairs-layout";
import { TORCH_DIES_X, torchLevel } from "../corridor/torch-failure";
import {
  createWalker,
  headBob,
  type Look,
  NO_INPUT,
  type StepEvent,
  stepWalker,
  type Walker,
  type WalkInput,
} from "../corridor/walker";
import type { DistantSounds } from "../distant-sounds";
import { spatialMix } from "../spatial";

type Movement = {
  walker: Walker;
  inner: { x: number; distance: number };
  eye: { x: number; y: number; z: number };
  step: StepEvent;
  stairDoor: number;
  sealed: boolean;
  shake: number;
  screen: number | null;
  finale: number | null;
  torch: number;
};

export type Descent = {
  update: (input: WalkInput, look: Look, dt: number, now: number, hush: number) => Movement;
};

function tremble(since: number): number {
  if (since < SEAL_RISE_MS) return 1.4;
  return 6 * Math.max(0, 1 - (since - SEAL_RISE_MS) / 450);
}

const STAIR_PACE = 0.62;

export function createDescent(sounds: RefObject<DistantSounds | null>): Descent {
  let walker = createWalker();
  let openedAt: number | null = null;
  let sealedAt: number | null = null;
  let screenAt: number | null = null;
  let finaleAt: number | null = null;
  let descended = false;
  let hushed = false;
  let torchDiedAt: number | null = null;

  return {
    update(input, look, dt, now, hush) {
      const opening = doorOpening(openedAt, now);
      const ground = { doorOpen: opening > 0.6, sealed: sealedAt !== null };
      const pace = (toDescent(walker.x, walker.distance).x > STAIRS_TOP_X ? STAIR_PACE : 1) * hush;
      const moved = stepWalker(
        walker,
        finaleAt === null ? input : NO_INPUT,
        look,
        dt,
        (x, d) => walkable(x, d, ground),
        pace,
      );
      walker = moved.walker;
      const inner = toDescent(walker.x, walker.distance);
      const door = spatialMix(
        { x: walker.x, z: -walker.distance, yaw: walker.yaw },
        { x: 0, z: -END_DISTANCE },
      );

      if (openedAt === null && doorShouldOpen(walker, corridorCamera.slammed.has(FIRST_DOOR))) {
        openedAt = now;
        sounds.current?.doorCreak(door.pan);
      }
      if (!descended && inner.x > STAIRS_TOP_X) {
        descended = true;
        sounds.current?.enterStairs();
      }
      if (sealedAt === null && inner.x > SEAL_X) {
        sealedAt = now;
        sounds.current?.seal();
      }

      if (screenAt === null && inner.x > SCREEN_X) {
        screenAt = now;
        sounds.current?.screenOn();
      }
      if (torchDiedAt === null && inner.x > TORCH_DIES_X) {
        torchDiedAt = now;
        sounds.current?.torchDies();
      }
      if (finaleAt === null && screenAt !== null && inner.x > FINALE_X) finaleAt = now;
      if (!hushed && finaleAt !== null && now - finaleAt > FINALE.snowOut[0]) {
        hushed = true;
        sounds.current?.hush(3.5);
      }
      const sign = Math.hypot(inner.x - HALL.doorwayX, -inner.distance - STAIRS.doorZ);
      sounds.current?.neonBuzz(Math.max(0, 1 - sign / 1400) * 0.5);

      const drop = stairsDrop(inner.x);
      const fromDoor = Math.hypot(walker.x, walker.distance - END_DISTANCE);
      const through = inner.x > STAIRS.doorX;
      const draft = through ? 0.24 : 0.3 * opening * Math.max(0, 1 - fromDoor / 900);
      sounds.current?.draft(draft, through ? 0 : door.pan);
      return {
        walker,
        inner,
        eye: { x: walker.x, y: headBob(walker) - drop, z: -walker.distance },
        step: moved.step && drop > 0 ? { ...moved.step, stairs: true } : moved.step,
        stairDoor: sealedAt === null ? opening : opening * Math.max(0, 1 - (now - sealedAt) / 300),
        sealed: sealedAt !== null,
        shake: sealedAt === null ? 0 : tremble(now - sealedAt),
        screen: screenAt === null ? null : now - screenAt,
        finale: finaleAt === null ? null : now - finaleAt,
        torch: torchLevel(torchDiedAt),
      };
    },
  };
}
