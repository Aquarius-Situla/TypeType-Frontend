import { create } from "zustand";

type State = {
  highlight: string | null;
  setHighlight: (id: string | null) => void;
};

export const useAlgorithmHighlightStore = create<State>((set) => ({
  highlight: null,
  setHighlight: (highlight) => set({ highlight }),
}));
