export function isSeekSettled(currentTime: number, target: number): boolean {
  if (currentTime > 0) {
    return Math.abs(currentTime - target) <= 2.5;
  }
  return target <= 0.3;
}
