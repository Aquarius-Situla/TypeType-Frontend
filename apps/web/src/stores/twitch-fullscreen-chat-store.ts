import { create } from "zustand";
import { persist } from "zustand/middleware";

type State = { open: boolean; toggle: () => void };

export const useTwitchFullscreenChatStore = create<State>()(
  persist((set) => ({ open: true, toggle: () => set((state) => ({ open: !state.open })) }), {
    name: "typetype-twitch-fullscreen-chat",
  }),
);
