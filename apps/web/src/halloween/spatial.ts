export type SpatialMix = {
  gain: number;
  pan: number;
  lowpass: number;
};

export function spatialMix(
  listener: { x: number; z: number; yaw: number },
  source: { x: number; z: number },
  reference = 600,
): SpatialMix {
  const dx = source.x - listener.x;
  const dz = source.z - listener.z;
  const distance = Math.hypot(dx, dz);
  const angle = Math.atan2(dx, -dz) - listener.yaw;
  const pan = distance < 1 ? 0 : Math.sin(angle) * Math.min(1, distance / reference);
  const gain = 1 / (1 + (distance / reference) ** 2);
  const lowpass = Math.max(350, 16000 / (1 + distance / (reference * 0.6)));
  const behind = Math.cos(angle) < 0 ? 0.75 : 1;
  return { gain: gain * behind, pan, lowpass };
}
