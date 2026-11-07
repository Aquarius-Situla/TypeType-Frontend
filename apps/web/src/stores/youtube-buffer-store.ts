import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isYoutubeBufferLevel, type YoutubeBufferLevel } from "../lib/youtube-buffer";

type YoutubeBufferStore = {
  level: YoutubeBufferLevel;
  setLevel: (level: YoutubeBufferLevel) => void;
};

export const useYoutubeBufferStore = create<YoutubeBufferStore>()(
  persist(
    (set) => ({
      level: "normal",
      setLevel: (level) => set({ level }),
    }),
    {
      name: "typetype-youtube-buffer",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ level: state.level }),
      merge: (persisted, current) => {
        const stored = (persisted as { level?: unknown } | undefined)?.level;
        return { ...current, level: isYoutubeBufferLevel(stored) ? stored : current.level };
      },
    },
  ),
);
