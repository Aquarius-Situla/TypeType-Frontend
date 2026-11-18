import { create } from "zustand";

type Archive = { id: string; startedAt: string };

type TwitchRewindStore = {
  // The past broadcast the open live is recording, or null on a channel that keeps none.
  archive: Archive | null;
  setArchive: (archive: Archive | null) => void;
};

// Twitch lists only the last seconds of a live; going further back opens the past broadcast it is recording.
export const useTwitchRewindStore = create<TwitchRewindStore>()((set) => ({
  archive: null,
  setArchive: (archive) => set({ archive }),
}));
