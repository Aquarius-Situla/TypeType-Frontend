import { create } from "zustand";
import { persist } from "zustand/middleware";
import { sanitizeLanguages, type TwitchLanguage, toggleLanguage } from "../lib/twitch-language";

type TwitchLanguageStore = {
  languages: TwitchLanguage[];
  toggle: (code: TwitchLanguage) => void;
  clear: () => void;
};

export const useTwitchLanguageStore = create<TwitchLanguageStore>()(
  persist(
    (set) => ({
      languages: [],
      toggle: (code) => set((state) => ({ languages: toggleLanguage(state.languages, code) })),
      clear: () => set({ languages: [] }),
    }),
    {
      name: "typetype-twitch-languages",
      merge: (stored, current) => ({
        ...current,
        languages: sanitizeLanguages(
          (stored as Partial<TwitchLanguageStore> | undefined)?.languages,
        ),
      }),
    },
  ),
);
