import {
  ACESFilmicToneMapping,
  Color,
  Fog,
  MeshStandardMaterial,
  Object3D,
  PCFShadowMap,
  PerspectiveCamera,
  Scene,
  SpotLight,
  SRGBColorSpace,
  WebGLRenderer,
} from "three";
import { corridorCamera } from "../corridor/corridor-camera";
import { CORRIDOR } from "../corridor/corridor-config";
import { watcherDoorSide } from "../corridor/corridor-story";
import { type WatcherFrame, watcherFrame } from "../corridor/watcher-scene";
import { createAlarmBeacons } from "./alarm-beacons";
import { aimCamera, type Slam } from "./camera-rig";
import { createChalkControls } from "./chalk-controls";
import { createExitArrows } from "./exit-arrows";
import { createFadeVeil } from "./fade-veil";
import type { FrameState } from "./frame-state";
import { createMaterials } from "./materials";
import { loadModels } from "./models";
import { loadNurseryFace } from "./nursery-room";
import { prewarm } from "./prewarm";
import { createRoomLook } from "./room-look";
import { buildSegment, disposeSegment, type Segment } from "./segment";
import { createToyFigures } from "./toy-figures";
import { createUnderground } from "./underground";

export type CorridorWorld = {
  render: (state: FrameState) => void;
  syncSegments: (indices: number[]) => void;
  slam: (segment: number, now: number) => void;
  resize: () => void;
  dispose: () => void;
};

const FLASHLIGHT = 5200;
const FAR = 7000;
const NURSERY_FAR = 26000;
const SLAM_MS = 160;
const OPEN = (40 * Math.PI) / 180;
const NO_SCENE: WatcherFrame = watcherFrame(null, 0);

export async function createCorridorWorld(canvas: HTMLCanvasElement): Promise<CorridorWorld> {
  const renderer = new WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(1.5, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFShadowMap;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.outputColorSpace = SRGBColorSpace;
  const scene = new Scene();
  scene.background = new Color(0x000000);
  const fog = new Fog(0x000000, CORRIDOR.fogClear, CORRIDOR.fogSolid);
  scene.fog = fog;
  const camera = new PerspectiveCamera(70, innerWidth / innerHeight, 5, FAR);
  camera.rotation.order = "YXZ";
  const flashlight = new SpotLight(0xffe2bc, 0, 2800, 0.42, 0.55, 1.25);
  flashlight.castShadow = true;
  flashlight.shadow.mapSize.set(1024, 1024);
  flashlight.shadow.bias = -0.0015;
  flashlight.position.set(14, -16, 0);
  const aimTarget = new Object3D();
  aimTarget.position.set(0, -28, -400);
  flashlight.target = aimTarget;
  camera.add(flashlight, aimTarget);
  scene.add(camera);

  const veil = createFadeVeil(camera);
  const [materials, models, face] = await Promise.all([
    createMaterials(CORRIDOR.segmentLength, CORRIDOR.width, CORRIDOR.ceiling + CORRIDOR.floor),
    loadModels(),
    loadNurseryFace(),
  ]);
  const room = createRoomLook(scene, models.head);
  const signs = createExitArrows();
  const chalk = createChalkControls();
  const beacons = createAlarmBeacons(scene, models.sounder);
  const toys = createToyFigures(scene, models.toys);
  const kit = { materials, models, room: room.materials, signs, chalk: chalk.mesh, beacons };
  const segments = new Map<number, Segment>();
  const slams = new Map<number, number>();

  const resize = (): void => {
    renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  };
  resize();

  const dark = new MeshStandardMaterial({ color: 0x1c1b19, roughness: 1 });
  const underground = createUnderground(scene, models, materials, dark, face);
  prewarm(renderer, scene, camera, kit, room);
  underground.prewarm(renderer);
  const restored = (): void => room.prewarm(renderer);
  canvas.addEventListener("webglcontextrestored", restored);

  const lastSlam = (now: number): Slam | null => {
    let latest: Slam | null = null;
    for (const [segment, at] of slams) {
      const side = watcherDoorSide(segment);
      if (side && (!latest || now - at < latest.since)) latest = { since: now - at, side };
    }
    return latest;
  };

  return {
    syncSegments(indices) {
      const wanted = new Set(indices);
      for (const [index, segment] of segments) {
        if (wanted.has(index)) continue;
        disposeSegment(segment);
        segments.delete(index);
      }
      for (const index of indices) {
        if (segments.has(index)) continue;
        const segment = buildSegment(index, kit);
        if (segment.door && corridorCamera.slammed.has(index)) segment.door.pivot.rotation.y = 0;
        segments.set(index, segment);
        scene.add(segment.group);
      }
    },
    slam(segment, now) {
      slams.set(segment, now);
    },
    render(state) {
      aimCamera(camera, state, lastSlam(state.now));
      beacons.update(state.alarm?.red ?? 0, -state.eye.z);
      flashlight.intensity = FLASHLIGHT * state.lamp;
      let door: Segment | null = null;
      for (const segment of segments.values()) {
        if (segment.door) door = segment;
      }
      underground.update(state);
      veil.set(state.fade);
      toys.update(state.toys, state.eye);
      fog.near = state.nursery ? 9000 : CORRIDOR.fogClear;
      fog.far = state.nursery ? 24000 : CORRIDOR.fogSolid;
      const far = state.nursery ? NURSERY_FAR : FAR;
      if (camera.far !== far) {
        camera.far = far;
        camera.updateProjectionMatrix();
      }
      if (door?.door) {
        const slammedAt = slams.get(door.index);
        if (slammedAt !== undefined) {
          const t = Math.min(1, (state.now - slammedAt) / SLAM_MS);
          door.door.pivot.rotation.y = OPEN * (1 - t * t);
        }
      }
      room.apply(door?.door ?? null, {
        frame:
          state.watcher && state.watcher.segment === door?.index ? state.watcher.frame : NO_SCENE,
        slammed: door !== null && corridorCamera.slammed.has(door.index),
        now: state.now,
      });
      underground.renderFeed(renderer);
      renderer.render(scene, camera);
    },
    resize,
    dispose() {
      for (const segment of segments.values()) disposeSegment(segment);
      segments.clear();
      materials.dispose();
      room.dispose();
      underground.dispose();
      signs.dispose();
      chalk.dispose();
      veil.dispose();
      toys.dispose();
      beacons.dispose();
      dark.dispose();
      canvas.removeEventListener("webglcontextrestored", restored);
      renderer.dispose();
    },
  };
}
