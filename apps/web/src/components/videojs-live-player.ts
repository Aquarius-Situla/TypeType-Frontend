import { createPlayer, qualityFeature } from "@videojs/react";
import { liveVideoFeatures } from "@videojs/react/live-video";

export const { Player: VideoJsLivePlayer } = createPlayer({
  features: [...liveVideoFeatures, qualityFeature],
});
