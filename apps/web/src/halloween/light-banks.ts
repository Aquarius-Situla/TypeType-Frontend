export const BANK_COUNT = 4;
export const DARK_ALPHA = 1;

const SWITCH_MS = 60;
const AFTERGLOW_MS = 900;
const AFTERGLOW_START = 0.9;

export type GradientStop = {
  offset: number;
  alpha: number;
};

export function bankAlpha(elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  if (elapsedMs < SWITCH_MS) return (elapsedMs / SWITCH_MS) * AFTERGLOW_START;
  const t = Math.min(1, (elapsedMs - SWITCH_MS) / AFTERGLOW_MS);
  return AFTERGLOW_START + (DARK_ALPHA - AFTERGLOW_START) * (1 - (1 - t) ** 3);
}

export function bankGradientStops(alphas: readonly number[], feather: number): GradientStop[] {
  const count = alphas.length;
  const stops: GradientStop[] = [];
  for (let position = 0; position < count; position += 1) {
    const alpha = alphas[count - 1 - position] ?? 0;
    const start = position / count;
    const end = (position + 1) / count;
    stops.push({ offset: position === 0 ? 0 : start + feather, alpha });
    stops.push({ offset: position === count - 1 ? 1 : end - feather, alpha });
  }
  return stops;
}
