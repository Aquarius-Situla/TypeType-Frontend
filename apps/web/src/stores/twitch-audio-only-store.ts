import { create } from "zustand";
import { persist } from "zustand/middleware";

type TwitchAudioOnlyStore = {
  audioOnly: boolean;
  toggle: () => void;
};

// Like on Twitch, the choice stays for the next lives and past broadcasts.
export const useTwitchAudioOnlyStore = create<TwitchAudioOnlyStore>()(
  persist(
    (set) => ({
      audioOnly: false,
      toggle: () => set((state) => ({ audioOnly: !state.audioOnly })),
    }),
    { name: "typetype-twitch-audio-only" },
  ),
);
