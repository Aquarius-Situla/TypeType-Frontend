// A browser opens six connections to the instance. A preflight can hold one for a long time
// when the provider is slow: more than two at once and images and pages wait behind them.
const MAX_HOVER_PREFLIGHTS = 2;
let taken = 0;

export function takeHoverPreflight(): boolean {
  if (taken >= MAX_HOVER_PREFLIGHTS) return false;
  taken += 1;
  return true;
}

export function releaseHoverPreflight(): void {
  taken = Math.max(0, taken - 1);
}
