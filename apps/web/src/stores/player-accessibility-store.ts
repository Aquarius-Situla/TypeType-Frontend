import { create } from "zustand";
import { persist } from "zustand/middleware";

type PlayerAccessibilityStore = {
  announcements: boolean;
  keyboardAnimations: boolean;
  setAnnouncements: (on: boolean) => void;
  setKeyboardAnimations: (on: boolean) => void;
};

// The two switches of the Vidstack accessibility menu: spoken status changes and the feedback shown for shortcuts.
export const usePlayerAccessibilityStore = create<PlayerAccessibilityStore>()(
  persist(
    (set) => ({
      announcements: true,
      keyboardAnimations: true,
      setAnnouncements: (announcements) => set({ announcements }),
      setKeyboardAnimations: (keyboardAnimations) => set({ keyboardAnimations }),
    }),
    { name: "typed-player-accessibility" },
  ),
);
