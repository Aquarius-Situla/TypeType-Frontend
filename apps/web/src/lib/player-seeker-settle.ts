const DEFAULT_KEYFRAME_TOLERANCE_SECONDS = 6.0;

export function isSeekSettled(
  currentTime: number,
  target: number,
  tolerance = DEFAULT_KEYFRAME_TOLERANCE_SECONDS,
): boolean {
  if (currentTime > 0) {
    if (currentTime >= target) {
      return currentTime - target <= 15.0;
    }
    return target - currentTime <= tolerance;
  }
  return target <= 0.3;
}
