import type { RefObject } from "react";
import { CORRIDOR } from "../corridor/corridor-config";
import type { AlarmFrame } from "../corridor/fire-alarm";
import type { Toy } from "../corridor/toys-behind";
import type { Look, Walker, WalkInput } from "../corridor/walker";
import { creditsDue } from "../credits/credits-timing";
import type { DistantSounds } from "../distant-sounds";
import { useEndCredits } from "../end-credits-store";
import { createAlarmDirector } from "./alarm-director";
import { createGuideDirector } from "./guide-director";
import { createNurseryDirector, type NurseryStep } from "./nursery-director";
import { createToysDirector } from "./toys-director";

type Eye = { x: number; y: number; z: number };

type EventsContext = {
  walker: Walker;
  eye: Eye;
  input: WalkInput;
  look: Look;
  watched: boolean;
  peeking: boolean;
  lit: boolean;
  finale: number | null;
};

type EventsFrame = {
  ringing: AlarmFrame | null;
  trap: NurseryStep | null;
  toys: { lamp: number; toys: Toy[] };
};

export type CorridorEvents = {
  update: (context: EventsContext, dt: number, now: number) => EventsFrame;
  steer: (input: WalkInput, look: Look, dt: number) => WalkInput;
  steering: () => boolean;
  springs: () => boolean;
  dispose: () => void;
};

export function createCorridorEvents(sounds: RefObject<DistantSounds | null>): CorridorEvents {
  const alarm = createAlarmDirector(sounds);
  const nursery = createNurseryDirector(sounds);
  const toys = createToysDirector(sounds);
  const guide = createGuideDirector();
  return {
    update({ walker, eye, input, look, watched, peeking, lit, finale }, dt, now) {
      if (creditsDue(finale) && useEndCredits.getState().startedAt === null) {
        useEndCredits.getState().start(now);
        sounds.current?.credits();
      }
      const inCorridor = Math.abs(walker.x) < CORRIDOR.width / 2;
      guide.update(walker, watched);
      const ringing = alarm.update(walker, now, inCorridor && !watched && !nursery.springs());
      const trap = nursery.update(alarm.pulledAt(), eye, input, look, dt, now);
      sounds.current?.isolate(nursery.springs());
      if (nursery.springs()) alarm.cancel();
      if (!nursery.active()) alarm.release();
      const quiet = inCorridor && !watched && !peeking && !ringing && !nursery.active();
      return { ringing, trap, toys: toys.update(walker, lit, quiet, dt) };
    },
    steer: (input, look, dt) => guide.steer(input, look, dt),
    steering: () => guide.steering(),
    springs: () => nursery.springs(),
    dispose: () => {
      alarm.dispose();
      guide.dispose();
    },
  };
}
