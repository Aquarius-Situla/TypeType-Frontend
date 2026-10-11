import { create } from "zustand";
import { persist } from "zustand/middleware";

export type HomeLayout = "grid" | "rows";

type State = { layout: HomeLayout; setLayout: (layout: HomeLayout) => void };

export const useHomeLayoutStore = create<State>()(
  persist((set) => ({ layout: "grid", setLayout: (layout) => set({ layout }) }), {
    name: "typetype-home-layout",
  }),
);
