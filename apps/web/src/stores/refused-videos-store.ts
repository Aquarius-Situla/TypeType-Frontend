import { create } from "zustand";

export type Refusal = {
  id: string | null;
  explained: boolean;
  notThisSubject?: boolean;
};

type State = {
  refused: Record<string, Refusal>;
  refuse: (url: string, refusal: Refusal) => void;
  restore: (url: string) => void;
};

export const useRefusedVideosStore = create<State>((set) => ({
  refused: {},
  refuse: (url, refusal) => set((state) => ({ refused: { ...state.refused, [url]: refusal } })),
  restore: (url) =>
    set((state) => {
      const { [url]: _restored, ...refused } = state.refused;
      return { refused };
    }),
}));
