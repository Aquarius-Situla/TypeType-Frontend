import { create } from "zustand";

export type Refusal = {
  id: string | null;
  explained: boolean;
  notThisSubject?: boolean;
};

type State = {
  refused: Record<string, Record<string, Refusal>>;
  refuse: (profileId: string, url: string, refusal: Refusal) => void;
  restore: (profileId: string, url: string) => void;
};

export const EMPTY_REFUSED_VIDEOS: Record<string, Refusal> = {};

export const useRefusedVideosStore = create<State>((set) => ({
  refused: {},
  refuse: (profileId, url, refusal) => {
    if (!profileId) return;
    set((state) => ({
      refused: {
        ...state.refused,
        [profileId]: { ...state.refused[profileId], [url]: refusal },
      },
    }));
  },
  restore: (profileId, url) => {
    if (!profileId) return;
    set((state) => {
      const current = state.refused[profileId];
      if (!current?.[url]) return state;
      const refused = { ...current };
      delete refused[url];
      const profiles = { ...state.refused };
      if (Object.keys(refused).length === 0) delete profiles[profileId];
      else profiles[profileId] = refused;
      return { refused: profiles };
    });
  },
}));
