import { create } from "zustand";

type FirstFrameState = {
  videoId: string | null;
  mark: (videoId: string) => void;
};

/** The last video (by its public watch parameter) whose picture started moving: the rest of its page loads after that. */
export const useFirstFrameStore = create<FirstFrameState>((set) => ({
  videoId: null,
  mark: (videoId) => set({ videoId }),
}));
