import { m } from "../../paraglide/messages.js";
import { corridorCamera } from "../corridor/corridor-camera";
import { FIRST_DOOR, peekSpot, watcherDoorSide } from "../corridor/corridor-story";
import { guideWanted, steer } from "../corridor/guide-back";
import type { Look, Walker, WalkInput } from "../corridor/walker";
import { useSubtitle } from "../subtitle-store";

export type GuideDirector = {
  steer: (input: WalkInput, look: Look, dt: number) => WalkInput;
  update: (walker: Walker, watched: boolean) => void;
  steering: () => boolean;
  dispose: () => void;
};

export function createGuideDirector(): GuideDirector {
  const spot = peekSpot(FIRST_DOOR, watcherDoorSide(FIRST_DOOR) ?? "left");
  let walker: Walker | null = null;
  let active = false;
  let settling = false;
  const show = (on: boolean): void =>
    useSubtitle.getState().say(on ? m.halloween_guide_subtitle() : null);

  return {
    steer(input, look, dt) {
      if (!active || !walker) return input;
      const steered = steer(walker, look, spot, settling, dt);
      settling = steered.settling;
      look.yaw = steered.look.yaw;
      look.pitch = steered.look.pitch;
      return steered.input;
    },
    update(next, watched) {
      walker = next;
      const seen = corridorCamera.slammed.has(FIRST_DOOR);
      if (!active && guideWanted(next.distance, seen)) {
        active = true;
        settling = false;
        show(true);
      }
      if (active && (watched || seen)) {
        active = false;
        show(false);
      }
    },
    steering: () => active,
    dispose: () => show(false),
  };
}
