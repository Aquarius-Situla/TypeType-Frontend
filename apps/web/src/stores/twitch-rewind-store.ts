import { create } from "zustand";

type Archive = { id: string; startedAt: string };

type TwitchRewindStore = {
  // The channel of the open live, and the past broadcast it is recording (null when it keeps none).
  login: string | null;
  archive: Archive | null;
  // Set while the live page plays that recording behind the live edge.
  rewinding: boolean;
  positionMs: number;
  seek: ((seconds: number) => void) | null;
  setChannel: (login: string | null, archive: Archive | null) => void;
  startRewind: (seek: (seconds: number) => void) => void;
  setPosition: (positionMs: number) => void;
  stopRewind: () => void;
};

// Twitch lists only the last seconds of a live; going further back plays the past broadcast it is recording.
export const useTwitchRewindStore = create<TwitchRewindStore>()((set) => ({
  login: null,
  archive: null,
  rewinding: false,
  positionMs: 0,
  seek: null,
  setChannel: (login, archive) => set({ login, archive }),
  startRewind: (seek) => set({ rewinding: true, seek }),
  setPosition: (positionMs) => set({ positionMs }),
  stopRewind: () => set({ rewinding: false, seek: null }),
}));
