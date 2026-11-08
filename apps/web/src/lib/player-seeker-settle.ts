const DEFAULT_KEYFRAME_TOLERANCE_SECONDS = 5.0;
const FORWARD_SETTLE_TOLERANCE_SECONDS = 2.0;

export function isSeekSettled(
  currentTime: number,
  target: number,
  tolerance = DEFAULT_KEYFRAME_TOLERANCE_SECONDS,
): boolean {
  if (currentTime > 0) {
    if (currentTime >= target) {
      return currentTime - target <= FORWARD_SETTLE_TOLERANCE_SECONDS;
    }
    return target - currentTime <= tolerance;
  }
  return target <= 0.3;
}
