import { create } from "zustand";

type LiveChatState = {
  videoId: string | null;
  open: boolean;
  endedVideoId: string | null;
  toggle: (videoId: string) => void;
  close: () => void;
  markEnded: (videoId: string) => void;
};

export const useLiveChatStore = create<LiveChatState>((set) => ({
  videoId: null,
  open: false,
  endedVideoId: null,
  toggle: (videoId) =>
    set((state) =>
      state.videoId === videoId
        ? { open: !state.open }
        : { videoId, open: true, endedVideoId: null },
    ),
  close: () => set({ open: false }),
  markEnded: (videoId) =>
    set((state) => ({
      videoId,
      endedVideoId: videoId,
      open: state.videoId === videoId && state.open,
    })),
}));
