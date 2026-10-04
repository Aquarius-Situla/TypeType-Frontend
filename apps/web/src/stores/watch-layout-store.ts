import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type WatchLayoutStore = {
  cinemaMode: boolean;
  setCinemaMode: (value: boolean) => void;
  toggleCinemaMode: () => void;
  webFullscreen: boolean;
  setWebFullscreen: (value: boolean) => void;
  toggleWebFullscreen: () => void;
};

const fallbackStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
};

export const useWatchLayoutStore = create<WatchLayoutStore>()(
  persist(
    (set) => ({
      cinemaMode: false,
      setCinemaMode: (value) => set({ cinemaMode: value }),
      toggleCinemaMode: () =>
        set((state) => ({
          cinemaMode: !state.cinemaMode,
          webFullscreen: state.cinemaMode ? state.webFullscreen : false,
        })),
      webFullscreen: false,
      setWebFullscreen: (value) => set({ webFullscreen: value }),
      toggleWebFullscreen: () =>
        set((state) => ({
          webFullscreen: !state.webFullscreen,
          cinemaMode: state.webFullscreen ? state.cinemaMode : false,
        })),
    }),
    {
      name: "typed-watch-layout",
      storage: createJSONStorage(() => {
        try {
          if (typeof window !== "undefined" && window.localStorage) {
            return window.localStorage;
          }
          if (typeof localStorage !== "undefined") {
            return localStorage;
          }
        } catch {
          // ignore storage access errors
        }
        return fallbackStorage;
      }),
      partialize: (state) => ({ cinemaMode: state.cinemaMode }),
    },
  ),
);
