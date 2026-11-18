import { create } from "zustand";

type LiveBreakStore = {
  // When the ad break the live service announced should end, or null outside one.
  endsAt: number | null;
  setEndsAt: (endsAt: number | null) => void;
};

export const useLiveBreakStore = create<LiveBreakStore>()((set) => ({
  endsAt: null,
  setEndsAt: (endsAt) => set((state) => (state.endsAt === endsAt ? state : { endsAt })),
}));
