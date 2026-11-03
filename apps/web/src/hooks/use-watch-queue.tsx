import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { WatchQueuePanel } from "../components/watch-queue-panel";
import {
  isPlaybackQueueActive,
  nextPlaybackEntry,
  type PlaybackQueueEntry,
  previousPlaybackEntry,
} from "../lib/playback-queue";
import { markWatchAutoplayIntent } from "../lib/watch-autoplay-intent";
import { usePlaybackQueueStore } from "../stores/playback-queue-store";
import type { VideoStream } from "../types/stream";
import { toPlaybackQueueEntry } from "./use-playback-queue-actions";

export function useWatchQueue(stream: VideoStream, currentParam: string) {
  const navigate = useNavigate();
  const queue = usePlaybackQueueStore((state) => state.queue);
  const setNowPlaying = usePlaybackQueueStore((state) => state.setNowPlaying);
  const sync = usePlaybackQueueStore((state) => state.sync);
  const remove = usePlaybackQueueStore((state) => state.remove);
  const clear = usePlaybackQueueStore((state) => state.clear);

  useEffect(() => {
    setNowPlaying({ ...toPlaybackQueueEntry(stream), param: currentParam });
    sync(currentParam);
  }, [stream, currentParam, setNowPlaying, sync]);

  const active =
    isPlaybackQueueActive(queue) && queue.entries[queue.currentIndex]?.param === currentParam;
  const next = active ? nextPlaybackEntry(queue) : null;
  const previous = active ? previousPlaybackEntry(queue) : null;
  const open = (entry: PlaybackQueueEntry) => {
    markWatchAutoplayIntent();
    void navigate({ to: "/watch", search: { v: entry.param } });
  };

  return {
    next,
    playNext: next ? () => open(next) : undefined,
    playPrevious: previous ? () => open(previous) : undefined,
    panel: active ? <WatchQueuePanel queue={queue} onRemove={remove} onClear={clear} /> : null,
  };
}
