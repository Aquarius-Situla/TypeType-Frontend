import { cryingLevel, NURSERY, type NurseryPhase } from "../corridor/nursery";
import type { Walker } from "../corridor/walker";
import type { NurserySounds } from "../nursery-sounds";
import { spatialMix } from "../spatial";

export function mixNursery(
  sounds: NurserySounds | undefined,
  walker: Walker,
  phase: NurseryPhase,
): void {
  const listener = { x: walker.x, z: -walker.distance, yaw: walker.yaw };
  if (phase === "room") {
    const crib = spatialMix(listener, { x: 0, z: -NURSERY.crib }, 1600);
    sounds?.ave(0.095, 0, 1100);
    sounds?.crying(cryingLevel(Math.hypot(walker.x, NURSERY.crib - walker.distance)), crib.pan);
  }
  if (phase === "emptied") sounds?.ave(0.095, 0, 1100);
  if (phase === "empty") {
    const tv = spatialMix(listener, { x: NURSERY.tv.x, z: -NURSERY.tv.along }, 1600);
    sounds?.ave(1.3, tv.pan * 0.5, 16000);
  }
}
