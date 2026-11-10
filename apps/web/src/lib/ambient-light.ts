export type AmbientLightContext = {
  enabled: boolean;
  cinemaMode: boolean;
  webFullscreen: boolean;
  audioOnly: boolean;
};

export function isAmbientLightActive(context: AmbientLightContext): boolean {
  return context.enabled && !context.cinemaMode && !context.webFullscreen && !context.audioOnly;
}

export type AmbientTuning = { spread: number; blur: number; brightness: number };

// The projector scales, spread fade and blur size follow Ambient light for YouTube by Wessel
// Kroos (MIT, github.com/WesselKroos/youtube-ambilight) with its default edge, fade start and
// fade curve.
const EDGE = 0.12;
const FADE_START = 0.15;
const FADE_EASING = 16 / (35 * 0.64);
const FADE_STEPS = 12;

export function ambientScales(spread: number): number[] {
  const levels = Math.max(1, Math.round(spread / 100 / EDGE));
  const scales: number[] = [];
  for (let level = levels; level >= 0; level -= 1) scales.push(1 + EDGE * level);
  return scales;
}

export function ambientBlurPx(blur: number, videoHeight: number): number {
  return blur * 1.275 * (videoHeight / 512);
}

// Opacity kept at each step from the video edge (0) to the outer edge of the light (1): full
// light over the first part of the edge, then the spread fade curve down to nothing.
export function ambientFadeStops(): Array<{ at: number; alpha: number }> {
  const stops = [
    { at: 0, alpha: 1 },
    { at: FADE_START, alpha: 1 },
  ];
  for (let step = 1; step <= FADE_STEPS; step += 1) {
    const progress = step / FADE_STEPS;
    stops.push({
      at: FADE_START + (1 - FADE_START) * progress,
      alpha: 1 - progress ** FADE_EASING,
    });
  }
  return stops;
}
