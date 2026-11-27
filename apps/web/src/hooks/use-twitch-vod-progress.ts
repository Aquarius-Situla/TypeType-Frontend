import { useState } from "react";
import { twitchVodProgressUrl } from "../lib/twitch-vod-progress-url";
import { isVideoWatched } from "../lib/watch-progress";
import { useProgress, useSaveProgress } from "./use-progress";
import { useWatchProgressPersistence } from "./use-watch-progress-persistence";
import { useWatchedThreshold } from "./use-watched-threshold";

// The resume point waits for the progress fetched on this visit: the cached value alone let an older position from
// this device overwrite a newer one saved on another. A past broadcast still recording grows behind the viewer: a
// position saved from its live sits close to its end and must not count as watched.
export function vodResumeAt(
  fetched: boolean,
  positionMs: number,
  durationSec: number,
  recording: boolean,
  watchedThreshold: number,
): number | null {
  if (!fetched) return null;
  return !recording && isVideoWatched(positionMs / 1000, durationSec, watchedThreshold)
    ? 0
    : positionMs;
}

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
  const ready = vodResumeAt(
    progress.isFetchedAfterMount,
    progress.data?.position ?? 0,
    durationSec,
    recording,
    watchedThreshold,
  );
  if (resumeAt === null && ready !== null) setResumeAt(ready);
  return {
    ready: resumeAt !== null,
    startTime: resumeAt ?? 0,
    onTimeUpdate: persistence.handleTimeUpdate,
    onPause: persistence.handlePause,
    onSeeked: persistence.handleSeeked,
    onEnded: persistence.handleEnded,
  };
}
