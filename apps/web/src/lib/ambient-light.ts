export type AmbientLightContext = {
  enabled: boolean;
  cinemaMode: boolean;
  webFullscreen: boolean;
  audioOnly: boolean;
};

export function isAmbientLightActive(context: AmbientLightContext): boolean {
  return context.enabled && !context.cinemaMode && !context.webFullscreen && !context.audioOnly;
}

export type AmbientRect = { x: number; y: number; width: number; height: number };

// Nested copies of the frame stretch from the player to the screen edges and fade outward, so
// the colors of each side of the video spill over the whole page like the Ambient light for
// YouTube extension does.
export const AMBIENT_LAYER_COUNT = 6;

export function ambientLayers(
  player: AmbientRect,
  screen: AmbientRect,
): Array<AmbientRect & { alpha: number }> {
  const layers: Array<AmbientRect & { alpha: number }> = [];
  for (let index = AMBIENT_LAYER_COUNT - 1; index >= 0; index -= 1) {
    const spread = (index / (AMBIENT_LAYER_COUNT - 1)) ** 1.6;
    layers.push({
      x: player.x + (screen.x - player.x) * spread,
      y: player.y + (screen.y - player.y) * spread,
      width: player.width + (screen.width - player.width) * spread,
      height: player.height + (screen.height - player.height) * spread,
      alpha: 1 - spread * 0.65,
    });
  }
  return layers;
}
