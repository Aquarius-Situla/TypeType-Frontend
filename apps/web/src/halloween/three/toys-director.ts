import type { RefObject } from "react";
import {
  flickerLamp,
  TOYS_START,
  type Toy,
  type ToysState,
  toysCalm,
  toysStep,
} from "../corridor/toys-behind";
import type { Walker } from "../corridor/walker";
import type { DistantSounds } from "../distant-sounds";
import { spatialMix } from "../spatial";

export type ToysDirector = {
  update: (
    walker: Walker,
    lit: boolean,
    quiet: boolean,
    dt: number,
  ) => { lamp: number; toys: Toy[] };
};

export function createToysDirector(sounds: RefObject<DistantSounds | null>): ToysDirector {
  let state: ToysState = TOYS_START;
  return {
    update(walker, lit, quiet, dt) {
      const calm = quiet && toysCalm(walker.distance);
      const stepped = toysStep(state, { ...walker, lit }, calm, dt);
      state = stepped.state;
      if (stepped.event === "drop") {
        const listener = { x: walker.x, z: -walker.distance, yaw: walker.yaw };
        const nearest = state.toys.reduce<Toy | null>(
          (best, toy) => (!best || toy.distance > best.distance ? toy : best),
          null,
        );
        if (nearest)
          sounds.current?.close.toyDrop(
            spatialMix(listener, { x: nearest.x, z: -nearest.distance }, 500),
          );
      }
      if (stepped.event === "flicker") sounds.current?.close.lampFlicker();
      return { lamp: flickerLamp(state), toys: state.toys };
    },
  };
}
