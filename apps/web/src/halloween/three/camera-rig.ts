import type { PerspectiveCamera } from "three";
import type { Side } from "../corridor/corridor-story";
import { slamJolt } from "../corridor/watcher-scene";
import type { FrameState } from "./frame-state";

const FOV = 70;
const FOCUSED_FOV = 44;
const FINALE_FOV = 26;

export type Slam = { since: number; side: Side };

export function aimCamera(camera: PerspectiveCamera, state: FrameState, slam: Slam | null): void {
  const jolt = slam ? slamJolt(slam.since) : { shake: 0, recoil: 0 };
  const amount = state.shake + jolt.shake;
  const shake = (): number => (Math.random() - 0.5) * amount;
  const away = slam?.side === "left" ? 1 : -1;
  camera.position.set(
    state.eye.x + shake() + away * jolt.recoil,
    state.eye.y + shake() - jolt.recoil * 0.3,
    state.eye.z + shake(),
  );
  camera.rotation.set(state.pitch + jolt.recoil * 0.004, -state.yaw, shake() * 0.002);
  const fov = Math.min(
    FOV + (FOCUSED_FOV - FOV) * state.focus,
    FOV + (FINALE_FOV - FOV) * (state.finale?.zoom ?? 0),
  );
  if (Math.abs(fov - camera.fov) > 0.01) {
    camera.fov += (fov - camera.fov) * 0.06;
    camera.updateProjectionMatrix();
  }
}
