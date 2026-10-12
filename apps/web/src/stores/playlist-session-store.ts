import { create } from "zustand";
import type { PlaylistSession } from "../lib/continuous-playlist";

type State = {
  session: PlaylistSession;
  setSession: (session: PlaylistSession) => void;
};

export const usePlaylistSessionStore = create<State>((set) => ({
  session: { key: "", visited: [] },
  setSession: (session) => set({ session }),
}));
