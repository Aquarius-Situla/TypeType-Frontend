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
  const position = progress.data?.position ?? 0;
  const startTime = isVideoWatched(position, durationSec * 1000) ? 0 : position;
  return {
    ready: !progress.isLoading,
    startTime,
    onTimeUpdate: persistence.handleTimeUpdate,
    onPause: persistence.handlePause,
    onSeeked: persistence.handleSeeked,
    onEnded: persistence.handleEnded,
  };
}
