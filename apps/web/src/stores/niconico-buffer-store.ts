import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isNiconicoBufferLevel, type NiconicoBufferLevel } from "../lib/niconico-buffer";

type NiconicoBufferStore = {
  level: NiconicoBufferLevel;
  setLevel: (level: NiconicoBufferLevel) => void;
};

export const useNiconicoBufferStore = create<NiconicoBufferStore>()(
  persist(
    (set) => ({
      level: "normal",
      setLevel: (level) => set({ level }),
    }),
    {
      name: "typetype-niconico-buffer",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ level: state.level }),
      merge: (persisted, current) => {
        const stored = (persisted as { level?: unknown } | undefined)?.level;
        return { ...current, level: isNiconicoBufferLevel(stored) ? stored : current.level };
      },
    },
  ),
);
