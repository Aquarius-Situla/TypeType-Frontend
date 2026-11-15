import { useState } from "react";
import { isVideoWatched } from "../lib/watch-progress";
import { useProgress, useSaveProgress } from "./use-progress";
import { useWatchProgressPersistence } from "./use-watch-progress-persistence";

const twitchVodProgressUrl = (id: string) => `https://www.twitch.tv/videos/${id}`;

export function useTwitchVodProgress(id: string, durationSec: number) {
  const url = twitchVodProgressUrl(id);
  const progress = useProgress(url);
  const save = useSaveProgress(url);
  const persistence = useWatchProgressPersistence({
    durationSec,
    isLive: false,
    mutate: (position, keepalive) => save.mutate({ position, keepalive }),
  });
  const [resumeAt, setResumeAt] = useState<number | null>(null);
  if (resumeAt === null && !progress.isLoading) {
    const position = progress.data?.position ?? 0;
    setResumeAt(isVideoWatched(position, durationSec * 1000) ? 0 : position);
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
