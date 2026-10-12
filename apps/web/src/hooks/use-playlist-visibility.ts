import { create } from "zustand";
import { useAuthStore } from "../stores/auth-store";
import { useSettings } from "./use-settings";

type State = {
  overrides: Record<string, boolean>;
  setHidden: (key: string, hidden: boolean) => void;
};
const useVisibilityStore = create<State>((set) => ({
  overrides: {},
  setHidden: (key, hidden) =>
    set((state) => ({
      overrides: Object.fromEntries([
        ...Object.entries(state.overrides)
          .filter(([id]) => id !== key)
          .slice(-31),
        [key, hidden],
      ]),
    })),
}));

export function usePlaylistVisibility(list?: string) {
  const userId = useAuthStore((state) => state.me?.id ?? "anonymous");
  const { settings } = useSettings();
  const key = `${userId}:${list ?? "collection"}`;
  const override = useVisibilityStore((state) => state.overrides[key]);
  const setHidden = useVisibilityStore((state) => state.setHidden);
  const hidden = override ?? settings.hideUpcomingPlaylistVideos;
  return { hidden, toggle: () => setHidden(key, !hidden) };
}
