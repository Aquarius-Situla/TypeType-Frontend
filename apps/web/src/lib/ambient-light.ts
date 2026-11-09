import type { ResolvedTheme } from "../stores/theme-store";

export type AmbientLightContext = {
  enabled: boolean;
  theme: ResolvedTheme;
  cinemaMode: boolean;
  webFullscreen: boolean;
  audioOnly: boolean;
};

export function isAmbientLightActive(context: AmbientLightContext): boolean {
  return (
    context.enabled &&
    context.theme === "dark" &&
    !context.cinemaMode &&
    !context.webFullscreen &&
    !context.audioOnly
  );
}

// Nested copies of the frame, each a step larger and fainter, carry the edge colors outward
// before the blur, the way the Ambient light for YouTube extension stacks its projectors.
export const AMBIENT_LAYERS: ReadonlyArray<{ scale: number; alpha: number }> = [
  { scale: 1.36, alpha: 0.35 },
  { scale: 1.24, alpha: 0.55 },
  { scale: 1.12, alpha: 0.8 },
  { scale: 1, alpha: 1 },
];

export const AMBIENT_MAX_SCALE = AMBIENT_LAYERS[0].scale;

export function ambientLayerRect(
  canvasWidth: number,
  canvasHeight: number,
  scale: number,
): { x: number; y: number; width: number; height: number } {
  const width = (canvasWidth * scale) / AMBIENT_MAX_SCALE;
  const height = (canvasHeight * scale) / AMBIENT_MAX_SCALE;
  return { x: (canvasWidth - width) / 2, y: (canvasHeight - height) / 2, width, height };
}
