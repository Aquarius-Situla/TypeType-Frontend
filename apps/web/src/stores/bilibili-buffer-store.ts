import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import {
  type BilibiliBufferLevel,
  type BilibiliCdnRegion,
  isBilibiliBufferLevel,
  isBilibiliCdnRegion,
} from "../lib/bilibili-buffer";

type BilibiliBufferStore = {
  level: BilibiliBufferLevel;
  setLevel: (level: BilibiliBufferLevel) => void;
  serverRegion: BilibiliCdnRegion;
  setServerRegion: (serverRegion: BilibiliCdnRegion) => void;
  concurrentPrefetch: boolean;
  setConcurrentPrefetch: (concurrentPrefetch: boolean) => void;
};

export const useBilibiliBufferStore = create<BilibiliBufferStore>()(
  persist(
    (set) => ({
      level: "normal",
      setLevel: (level) => set({ level }),
      serverRegion: "overseas",
      setServerRegion: (serverRegion) => set({ serverRegion }),
      concurrentPrefetch: true,
      setConcurrentPrefetch: (concurrentPrefetch) => set({ concurrentPrefetch }),
    }),
    {
      name: "typetype-bilibili-buffer",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        level: state.level,
        serverRegion: state.serverRegion,
        concurrentPrefetch: state.concurrentPrefetch,
      }),
      merge: (persisted, current) => {
        const stored = persisted as Partial<BilibiliBufferStore> | undefined;
        return {
          ...current,
          level: isBilibiliBufferLevel(stored?.level) ? stored.level : current.level,
          serverRegion: isBilibiliCdnRegion(stored?.serverRegion) ? stored.serverRegion : current.serverRegion,
          concurrentPrefetch:
            typeof stored?.concurrentPrefetch === "boolean" ? stored.concurrentPrefetch : current.concurrentPrefetch,
        };
      },
    },
  ),
);
