import { create } from "zustand";
import { persist } from "zustand/middleware";

type WatchLayoutStore = {
  cinemaMode: boolean;
  setCinemaMode: (value: boolean) => void;
  toggleCinemaMode: () => void;
  webFullscreen: boolean;
  setWebFullscreen: (value: boolean) => void;
  toggleWebFullscreen: () => void;
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
    { name: "typed-watch-layout" },
  ),
);
