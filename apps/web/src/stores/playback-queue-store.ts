import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  EMPTY_PLAYBACK_QUEUE,
  enqueuePlaybackEntry,
  type PlaybackQueue,
  type PlaybackQueueEntry,
  type PlaybackQueueResult,
  removePlaybackEntry,
  syncPlaybackQueue,
} from "../lib/playback-queue";

type PlaybackQueueStore = {
  queue: PlaybackQueue;
  nowPlaying: PlaybackQueueEntry | null;
  setNowPlaying: (entry: PlaybackQueueEntry | null) => void;
  enqueue: (
    entry: PlaybackQueueEntry,
    playNext: boolean,
    playing: PlaybackQueueEntry | null,
  ) => PlaybackQueueResult;
  sync: (param: string) => void;
  remove: (param: string) => void;
  clear: () => void;
};

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const usePlaybackQueueStore = create<PlaybackQueueStore>()(
  persist(
    (set, get) => ({
      queue: EMPTY_PLAYBACK_QUEUE,
      nowPlaying: null,
      setNowPlaying: (entry) => set({ nowPlaying: entry }),
      enqueue: (entry, playNext, playing) => {
        const mutation = enqueuePlaybackEntry(get().queue, entry, playNext, playing);
        set({ queue: mutation.queue });
        return mutation.result;
      },
      sync: (param) => set((state) => ({ queue: syncPlaybackQueue(state.queue, param) })),
      remove: (param) => set((state) => ({ queue: removePlaybackEntry(state.queue, param) })),
      clear: () => set({ queue: EMPTY_PLAYBACK_QUEUE }),
    }),
    {
      name: "typetype-playback-queue",
      storage: createJSONStorage(() => {
        try {
          if (typeof sessionStorage !== "undefined") return sessionStorage;
        } catch {}
        return fallbackStorage;
      }),
      partialize: (state) => ({ queue: state.queue }),
    },
  ),
);
