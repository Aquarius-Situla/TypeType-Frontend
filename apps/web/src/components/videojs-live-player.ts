import { createPlayer, qualityFeature } from "@videojs/react";
import { liveVideoFeatures } from "@videojs/react/live-video";

export const { Player: VideoJsLivePlayer, usePlayer: useVideoJsLivePlayer } = createPlayer({
  features: [...liveVideoFeatures, qualityFeature],
});
