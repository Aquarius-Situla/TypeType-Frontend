import type { RefObject } from "react";
import {
  besideCrib,
  crackDue,
  crackShake,
  facesTv,
  fallDepth,
  fallFade,
  insideRoom,
  leanOver,
  NURSERY,
  type NurseryPhase,
  peersIntoCrib,
  sinkDue,
  trapsOnPull,
} from "../corridor/nursery";
import {
  createWalker,
  headBob,
  type Look,
  type StepEvent,
  stepWalker,
  type Walker,
  type WalkInput,
} from "../corridor/walker";
import type { DistantSounds } from "../distant-sounds";
import { mixNursery } from "./nursery-mix";
import type { NurseryView } from "./nursery-room";

type Eye = { x: number; y: number; z: number };

export type NurseryStep = {
  own: boolean;
  eye: Eye;
  step: StepEvent;
  fade: number;
  shake: number;
  view: NurseryView | null;
};

export type NurseryDirector = {
  update: (
    pulledAt: number | null,
    corridorEye: Eye,
    input: WalkInput,
    look: Look,
    dt: number,
    now: number,
  ) => NurseryStep | null;
  springs: () => boolean;
  active: () => boolean;
};

const { origin } = NURSERY;

export function createNurseryDirector(sounds: RefObject<DistantSounds | null>): NurseryDirector {
  let decidedFor: number | null = null;
  let pending: number | null = null;
  let phase: NurseryPhase | null = null;
  let at = 0;
  let cracks = 0;
  let walker: Walker = createWalker();
  let saved: Look = { yaw: 0, pitch: 0 };
  let fallFrom: Eye = { x: 0, y: 0, z: 0 };
  let stared = 0;
  const go = (next: NurseryPhase, now: number): void => {
    phase = next;
    at = now;
    cracks = 0;
  };
  const roomEye = (): Eye => ({
    x: origin.x + walker.x,
    y: origin.y + headBob(walker),
    z: origin.z - walker.distance,
  });
  const nurseryAudio = () => sounds.current?.nursery;
  const crumble = (since: number): boolean => {
    const crack = crackDue(since, cracks);
    if (!crack) return false;
    cracks += 1;
    nurseryAudio()?.floor(crack);
    return crack === "break";
  };

  return {
    springs: () => phase !== null && phase !== "creaking" && phase !== "back",
    active: () => phase !== null || pending !== null,
    update(pulledAt, corridorEye, input, look, dt, now) {
      if (pulledAt !== null && pulledAt !== decidedFor) {
        decidedFor = pulledAt;
        if (trapsOnPull(Math.random())) pending = pulledAt + NURSERY.creakAfterMs;
      }
      if (phase === null && pending !== null && now >= pending) {
        pending = null;
        go("creaking", now);
      }
      if (phase === null) return null;
      const since = now - at;
      if (phase === "creaking") {
        if (crumble(since)) {
          saved = { ...look };
          fallFrom = corridorEye;
          go("falling", now);
        }
        return {
          own: false,
          eye: corridorEye,
          step: null,
          fade: 0,
          shake: crackShake(since),
          view: null,
        };
      }
      if (phase === "back") {
        if (since >= NURSERY.trailMs) {
          nurseryAudio()?.endAve();
          phase = null;
          return null;
        }
        const fade = Math.max(0, 1 - since / NURSERY.backBlackMs);
        return { own: false, eye: corridorEye, step: null, fade, shake: 0, view: null };
      }
      let step: StepEvent = null;
      let fade = 0;
      let shake = 0;
      let eye = roomEye();
      if (phase === "falling") {
        eye = { ...fallFrom, y: fallFrom.y - fallDepth(since) };
        fade = fallFade(since);
        shake = crackShake(since + NURSERY.breakAtMs);
        if (since >= NURSERY.fallMs) {
          nurseryAudio()?.land();
          go("dark", now);
        }
      } else if (phase === "dark") {
        fade = 1;
        if (since >= NURSERY.blackMs) {
          walker = { ...createWalker(), distance: NURSERY.spawn };
          look.yaw = 0;
          look.pitch = -0.05;
          go("room", now);
        }
      } else if (phase === "dropping") {
        eye = { ...eye, y: eye.y - fallDepth(since) };
        fade = fallFade(since);
        shake = crackShake(since + NURSERY.breakAtMs);
        if (since >= NURSERY.fallMs) {
          nurseryAudio()?.land();
          nurseryAudio()?.trailAve();
          look.yaw = saved.yaw;
          look.pitch = saved.pitch;
          go("back", now);
        }
      } else {
        if (phase === "room") fade = Math.max(0, 1 - since / 1200);
        const moved = stepWalker(walker, input, look, dt, insideRoom);
        walker = moved.walker;
        step = moved.step;
        eye = roomEye();
        mixNursery(nurseryAudio(), walker, phase);
        if (phase === "room") {
          if (besideCrib(walker)) look.pitch = leanOver(look.pitch, dt);
          if (peersIntoCrib(walker)) {
            nurseryAudio()?.hushCrying();
            go("emptied", now);
          }
        } else if (phase === "emptied") {
          if (since >= NURSERY.emptyLookMs) {
            nurseryAudio()?.tvOn();
            stared = 0;
            go("empty", now);
          }
        } else if (phase === "empty") {
          if (facesTv(walker)) stared += dt * 1000;
          if (sinkDue(since, stared)) go("sinking", now);
        } else if (phase === "sinking") {
          shake = crackShake(since);
          if (crumble(since)) {
            nurseryAudio()?.muffleAve();
            go("dropping", now);
          }
        }
      }
      return { own: true, eye, step, fade, shake, view: { phase, since: now - at } };
    },
  };
}
