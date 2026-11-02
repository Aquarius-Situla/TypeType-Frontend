import { useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import type { PlaybackQueueEntry, PlaybackQueueResult } from "../lib/playback-queue";
import { markWatchAutoplayIntent } from "../lib/watch-autoplay-intent";
import { toPublicWatchParam } from "../lib/watch-url";
import { m } from "../paraglide/messages.js";
import { usePlaybackQueueStore } from "../stores/playback-queue-store";
import type { VideoStream } from "../types/stream";
import { usePersistentWatchPlayerStore } from "./use-persistent-watch-player";

export function toPlaybackQueueEntry(stream: VideoStream): PlaybackQueueEntry {
  return {
    param: toPublicWatchParam(stream.id),
    title: stream.title,
    thumbnail: stream.thumbnail,
    channelName: stream.channelName,
    duration: stream.duration,
  };
}

function playingEntry(): PlaybackQueueEntry | null {
  const player = usePersistentWatchPlayerStore.getState().entry;
  const nowPlaying = usePlaybackQueueStore.getState().nowPlaying;
  if (!player || !nowPlaying) return null;
  return toPublicWatchParam(player.streamId) === nowPlaying.param ? nowPlaying : null;
}

function resultMessage(result: PlaybackQueueResult, playNext: boolean): string {
  switch (result) {
    case "added":
      return playNext ? m.queue_toast_play_next() : m.queue_toast_added();
    case "moved":
      return m.queue_toast_moved();
    case "alreadyQueued":
      return m.queue_toast_already_queued();
    case "alreadyPlaying":
      return m.queue_toast_already_playing();
    case "started":
      return m.queue_toast_started();
  }
}

export function usePlaybackQueueActions() {
  const navigate = useNavigate();
  const enqueue = usePlaybackQueueStore((state) => state.enqueue);

  return useCallback(
    (stream: VideoStream, playNext: boolean): string => {
      const entry = toPlaybackQueueEntry(stream);
      const result = enqueue(entry, playNext, playingEntry());
      if (result === "started") {
        markWatchAutoplayIntent();
        void navigate({ to: "/watch", search: { v: entry.param } });
      }
      return resultMessage(result, playNext);
    },
    [enqueue, navigate],
  );
}
