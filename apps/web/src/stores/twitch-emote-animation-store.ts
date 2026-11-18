import { create } from "zustand";
import { persist } from "zustand/middleware";
import { isWebKitBrowser } from "../lib/twitch-emote-still";

type EmoteAnimationStore = {
  animated: boolean;
  toggle: () => void;
};

const webKit =
  typeof navigator !== "undefined" &&
  isWebKitBrowser(navigator.userAgent, navigator.maxTouchPoints ?? 0);

// Like the animated emotes switch of Twitch; it starts off on WebKit, where animations pile up threads.
export const useEmoteAnimationStore = create<EmoteAnimationStore>()(
  persist(
    (set) => ({
      animated: !webKit,
      toggle: () => set((state) => ({ animated: !state.animated })),
    }),
    { name: "typetype-twitch-animated-emotes" },
  ),
);
