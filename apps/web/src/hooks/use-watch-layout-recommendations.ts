import { useMemo } from "react";
import type { VideoStream } from "../types/stream";
import type { SettingsItem } from "../types/user";
import { useWatchRecommendations } from "./use-watch-recommendations";

export function useWatchLayoutRecommendations(
  stream: VideoStream,
  defaultService: SettingsItem["defaultService"],
  hideRelatedVideos: boolean,
  filter: (streams: VideoStream[]) => VideoStream[],
): VideoStream[] {
  const recommendations = useWatchRecommendations(stream, defaultService, hideRelatedVideos);
  return useMemo(() => filter(recommendations), [filter, recommendations]);
}
