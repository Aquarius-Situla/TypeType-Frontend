import { useMemo } from "react";
import { videoProgressUrl } from "../lib/video-progress";
import { isVideoWatched } from "../lib/watch-progress";
import type { VideoStream } from "../types/stream";
import { useVideoProgressMap } from "./use-progress";
import { useSettings } from "./use-settings";

const NO_STREAMS: VideoStream[] = [];

export function useUnwatchedStreams(streams: VideoStream[]): VideoStream[] {
  const { settings } = useSettings();
  const enabled = settings.hideWatchedSubscriptionVideos;
  const threshold = settings.watchedThresholdPercent;
  const progress = useVideoProgressMap(enabled ? streams : NO_STREAMS);
  return useMemo(() => {
    if (!enabled) return streams;
    return streams.filter((stream) => {
      if (stream.isLive) return true;
      const positionMs = progress.get(videoProgressUrl(stream))?.position ?? 0;
      return !isVideoWatched(positionMs / 1_000, stream.duration, threshold);
    });
  }, [enabled, progress, streams, threshold]);
}
