import { create } from "zustand";

type SubtitleState = { line: string | null; say: (line: string | null) => void };

export const useSubtitle = create<SubtitleState>()((set, get) => ({
  line: null,
  say: (line) => {
    if (get().line !== line) set({ line });
  },
}));
