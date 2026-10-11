import {
  DoubleSide,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type Scene,
  SpotLight,
  type WebGLRenderer,
} from "three";
import type { WatcherFrame } from "../corridor/watcher-scene";
import { tartanTexture } from "./blanket";
import type { DoorHandle } from "./door";
import type { HeadScan } from "./models";
import { createScreenFrames } from "./tv-screen";
import type { RoomMaterials } from "./watcher-room";
import { makeWatcherMaterial } from "./watcher-shader";

type RoomState = { frame: WatcherFrame; slammed: boolean; now: number };

export type RoomLook = {
  materials: RoomMaterials;
  apply: (door: DoorHandle | null, state: RoomState) => void;
  prewarm: (renderer: WebGLRenderer) => void;
  dispose: () => void;
};

const TV_LIGHT = 1300;
const TV_AFTERGLOW = [0.55, 0.3, 0.14, 0.05, 0];

export function createRoomLook(scene: Scene, head: HeadScan): RoomLook {
  const frames = createScreenFrames();
  const tartan = tartanTexture();
  const textures = [...frames.snow, ...frames.off, tartan];
  const watcher = new MeshStandardMaterial({
    map: head.color,
    normalMap: head.normal,
    color: 0xb4b6aa,
    roughness: 0.62,
  });
  const uniforms = makeWatcherMaterial(watcher);
  const materials: RoomMaterials = {
    screen: new MeshBasicMaterial({ map: frames.snow[0], color: 0xdde6ff, toneMapped: false }),
    watcher,
    blanket: new MeshStandardMaterial({ map: tartan, roughness: 1, side: DoubleSide }),
  };
  for (const material of Object.values(materials)) material.userData.shared = true;

  const light = new SpotLight(0x9fb8ff, 0, 1900, 0.8, 0.65, 1);
  light.castShadow = true;
  light.shadow.mapSize.set(512, 512);
  light.shadow.bias = -0.002;
  light.shadow.autoUpdate = false;
  scene.add(light, light.target);

  let flickerAt = 0;
  let flicker = 1;
  let sway = 0;

  return {
    materials,
    apply(door, { frame, slammed, now }) {
      if (!door) {
        light.intensity = 0;
        return;
      }
      door.lightFrom.getWorldPosition(light.position);
      door.lightTo.getWorldPosition(light.target.position);
      light.target.updateMatrixWorld();
      if (now - flickerAt > 70) {
        flickerAt = now;
        flicker = 0.72 + Math.random() * 0.28;
      }
      const playing = frame.tvOff === null;
      const off = Math.min(frames.off.length - 1, frame.tvOff ?? 0);
      materials.screen.map = playing
        ? (frames.snow[Math.floor(now / 70) % frames.snow.length] ?? null)
        : (frames.off[off] ?? null);
      door.screen.visible = playing || off < frames.off.length - 1;
      const glow = playing ? flicker : (TV_AFTERGLOW[off] ?? 0);
      light.intensity = slammed ? 0 : TV_LIGHT * glow;
      light.shadow.needsUpdate = light.intensity > 0;

      if (frame.idle) sway = Math.sin(now / 1700);
      uniforms.uSway.value = sway;
      uniforms.uTilt.value = frame.tilt;
      uniforms.uTurn.value = frame.turn;
      uniforms.uEyes.value = frame.eyes;
    },
    prewarm(renderer) {
      for (const texture of textures) renderer.initTexture(texture);
      light.shadow.needsUpdate = true;
    },
    dispose() {
      scene.remove(light, light.target);
      light.dispose();
      for (const material of Object.values(materials)) material.dispose();
      for (const texture of textures) texture.dispose();
    },
  };
}
