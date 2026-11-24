import { useMemo } from "react";
import { videoProgressUrl } from "../lib/video-progress";
import { isVideoWatched } from "../lib/watch-progress";
import type { VideoStream } from "../types/stream";
import type { ProgressItem } from "../types/user";
import { useVideoProgress, type VideoProgress } from "./use-progress";
import { useSettings } from "./use-settings";

export type UnwatchedStreams = {
  streams: VideoStream[];
  progressByUrl: Map<string, ProgressItem>;
  settled: boolean;
};

// A video whose progress is still loading stays hidden: showing it first and removing it a moment later made the
// grid jump and kept the end of the page in view, which loaded the next page again and again.
export function unwatchedStreams(
  streams: VideoStream[],
  progress: VideoProgress,
  thresholdPercent: number,
): VideoStream[] {
  return streams.filter((stream) => {
    if (stream.isLive) return true;
    const videoUrl = videoProgressUrl(stream);
    if (progress.pending.has(videoUrl)) return false;
    const positionMs = progress.byUrl.get(videoUrl)?.position ?? 0;
    return !isVideoWatched(positionMs / 1_000, stream.duration, thresholdPercent);
  });
}

export function useUnwatchedStreams(streams: VideoStream[]): UnwatchedStreams {
  const { settings } = useSettings();
  const enabled = settings.hideWatchedSubscriptionVideos;
  const threshold = settings.watchedThresholdPercent;
  const progress = useVideoProgress(streams);
  return useMemo(
    () => ({
      streams: enabled ? unwatchedStreams(streams, progress, threshold) : streams,
      progressByUrl: progress.byUrl,
      settled: progress.pending.size === 0,
    }),
    [enabled, progress, streams, threshold],
  );
}
