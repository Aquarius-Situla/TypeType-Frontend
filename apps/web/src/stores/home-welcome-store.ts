import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = { done: boolean; finish: () => void };

export const useHomeWelcomeStore = create<State>()(
  persist((set) => ({ done: false, finish: () => set({ done: true }) }), {
    name: "typetype-home-welcome",
  }),
);
