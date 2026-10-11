import { create } from "zustand";

type EndCreditsState = {
  startedAt: number | null;
  start: (at: number) => void;
  reset: () => void;
};

export const useEndCredits = create<EndCreditsState>()((set, get) => ({
  startedAt: null,
  start: (at) => {
    if (get().startedAt === null) set({ startedAt: at });
  },
  reset: () => set({ startedAt: null }),
}));
