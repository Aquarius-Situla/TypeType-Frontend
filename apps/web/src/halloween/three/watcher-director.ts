import type { RefObject } from "react";
import { corridorCamera } from "../corridor/corridor-camera";
import { CORRIDOR } from "../corridor/corridor-config";
import {
  type DoorWatch,
  doorX,
  doorZ,
  nearestDoor,
  type Side,
  watchDoor,
  watcherDoorSide,
} from "../corridor/corridor-story";
import type { Walker } from "../corridor/walker";
import {
  cracksDue,
  NECK_SNAP,
  sceneFocus,
  WATCHER_SCENE,
  type WatcherFrame,
  watcherFrame,
} from "../corridor/watcher-scene";
import type { DistantSounds } from "../distant-sounds";

export type WatcherView = { segment: number; frame: WatcherFrame };

export type WatcherDirector = {
  update: (
    walker: Walker,
    now: number,
  ) => { view: WatcherView | null; focus: number; held: boolean; peeking: boolean };
};

type Scene = {
  segment: number;
  side: Side;
  noticedAt: number;
  tvDead: boolean;
  staring: boolean;
  cracked: number;
  snapped: boolean;
};

const HOLD_AFTER_SLAM_MS = 900;
const SCENE_MS = WATCHER_SCENE.slam + WATCHER_SCENE.holdSilence + WATCHER_SCENE.release;

export function createWatcherDirector(
  sounds: RefObject<DistantSounds | null>,
  onSlam: (segment: number, now: number) => void,
): WatcherDirector {
  let watch: DoorWatch | null = null;
  let scene: Scene | null = null;

  return {
    update(walker, now) {
      const listener = { x: walker.x, z: -walker.distance, yaw: walker.yaw };
      const door = nearestDoor(Math.floor(walker.distance / CORRIDOR.segmentLength));
      const side = door === null ? null : watcherDoorSide(door);
      if (door !== null && side) {
        if (watch?.segment !== door) {
          watch = { segment: door, since: null, noticed: corridorCamera.slammed.has(door) };
        }
        const wasNoticed = watch.noticed;
        watch = watchDoor(watch, walker, side, now);
        if (watch.noticed && !wasNoticed) {
          scene = {
            segment: door,
            side,
            noticedAt: now,
            tvDead: false,
            staring: false,
            cracked: 0,
            snapped: false,
          };
        }
      }

      const frame = scene ? watcherFrame(scene.noticedAt, now) : null;
      if (scene && frame && frame.tvOff !== null && !scene.tvDead) {
        scene.tvDead = true;
        sounds.current?.tvOff(scene.side === "left" ? -0.5 : 0.5, 0.55, now);
      }
      if (scene && cracksDue(scene.noticedAt, now, scene.cracked) > 0) {
        sounds.current?.neckCrack(scene.side === "left" ? -0.4 : 0.4, scene.cracked);
        scene.cracked += 1;
      }
      if (scene && !scene.snapped && now - scene.noticedAt >= NECK_SNAP) {
        scene.snapped = true;
        sounds.current?.neckSnap(scene.side === "left" ? -0.4 : 0.4);
      }
      if (scene && frame && frame.eyes > 0 && !scene.staring) {
        scene.staring = true;
        sounds.current?.stretch(scene.side === "left" ? -0.35 : 0.35);
      }
      if (scene && frame?.slam && !corridorCamera.slammed.has(scene.segment)) {
        corridorCamera.slammed.add(scene.segment);
        onSlam(scene.segment, now);
        sounds.current?.slam(scene.side === "left" ? -0.6 : 0.6);
      }

      if (scene && now - scene.noticedAt > SCENE_MS) scene = null;
      const peeking = watch && !watch.noticed ? watch.since : null;
      const focus = sceneFocus(peeking, scene?.noticedAt ?? null, now);
      sounds.current?.focus(focus);
      if (door !== null && side) {
        const open = !corridorCamera.slammed.has(door);
        sounds.current?.update(listener, { x: doorX(side), z: doorZ(door), open }, now);
      } else {
        sounds.current?.update(listener, null, now);
      }
      const view = scene && frame ? { segment: scene.segment, frame } : null;
      const held =
        scene !== null && now - scene.noticedAt < WATCHER_SCENE.slam + HOLD_AFTER_SLAM_MS;
      return { view, focus, held, peeking: peeking !== null };
    },
  };
}
