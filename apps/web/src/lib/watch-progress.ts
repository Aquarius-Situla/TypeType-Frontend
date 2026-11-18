export function isVideoWatched(progress: number, duration: number, thresholdPercent = 0): boolean {
  if (!Number.isFinite(progress) || !Number.isFinite(duration)) return false;
  if (progress <= 0 || duration <= 0) return false;
  const boundedProgress = Math.min(progress, duration);
  if (thresholdPercent >= 50 && thresholdPercent <= 100) {
    return boundedProgress >= (duration * thresholdPercent) / 100;
  }
  if (duration > 60) return boundedProgress >= duration - 60;
  return boundedProgress >= duration * 0.9;
}

export function isVideoInProgress(
  progress: number,
  duration: number,
  thresholdPercent = 0,
): boolean {
  return progress > 0 && duration > 0 && !isVideoWatched(progress, duration, thresholdPercent);
}
