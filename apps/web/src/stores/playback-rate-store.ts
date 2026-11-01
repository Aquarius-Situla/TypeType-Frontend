import { create } from "zustand";

type PlaybackRateStore = {
  chosenRate: number | null;
  defaultRate: number | null;
  choose: (rate: number) => void;
  syncDefault: (rate: number) => boolean;
};

export const usePlaybackRateStore = create<PlaybackRateStore>((set, get) => ({
  chosenRate: null,
  defaultRate: null,
  choose: (rate) => set({ chosenRate: rate }),
  syncDefault: (rate) => {
    if (get().defaultRate === rate) return false;
    set({ defaultRate: rate, chosenRate: null });
    return true;
  },
}));
