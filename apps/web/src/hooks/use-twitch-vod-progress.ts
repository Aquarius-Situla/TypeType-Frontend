import { useState } from "react";
import { twitchVodProgressUrl } from "../lib/twitch-vod-progress-url";
import { isVideoWatched } from "../lib/watch-progress";
import { useProgress, useSaveProgress } from "./use-progress";
import { useWatchProgressPersistence } from "./use-watch-progress-persistence";
import { useWatchedThreshold } from "./use-watched-threshold";

// A past broadcast still recording grows behind the viewer: a position saved from its live sits close to its end
// and must not count as watched.
export function useTwitchVodProgress(id: string, durationSec: number, recording = false) {
  const url = twitchVodProgressUrl(id);
  const progress = useProgress(url);
  const save = useSaveProgress(url);
  const watchedThreshold = useWatchedThreshold();
  const persistence = useWatchProgressPersistence({
    durationSec,
    isLive: false,
    mutate: (position, keepalive) => save.mutate({ position, keepalive }),
  });
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  if (resumeAt === null && !progress.isLoading) {
    const position = progress.data?.position ?? 0;
    setResumeAt(
      !recording && isVideoWatched(position, durationSec * 1000, watchedThreshold) ? 0 : position,
    );
  }
  return {
    ready: resumeAt !== null,
    startTime: resumeAt ?? 0,
    onTimeUpdate: persistence.handleTimeUpdate,
    onPause: persistence.handlePause,
    onSeeked: persistence.handleSeeked,
    onEnded: persistence.handleEnded,
  };
}
