import { create } from "zustand";

type CorridorHint = "alarm" | null;

type HintState = { hint: CorridorHint; setHint: (hint: CorridorHint) => void };

export const useCorridorHint = create<HintState>()((set, get) => ({
  hint: null,
  setHint: (hint) => {
    if (get().hint !== hint) set({ hint });
  },
}));
