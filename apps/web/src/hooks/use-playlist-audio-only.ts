import { create } from "zustand";
import { useAuthStore } from "../stores/auth-store";

type State = {
  overrides: Record<string, boolean>;
  setEnabled: (key: string, enabled: boolean) => void;
};

export function playlistAudioOnlyKey(userId: string, playlistId: string) {
  return `${userId}:${playlistId}`;
}

export function resolvePlaylistAudioOnly(
  overrides: Readonly<Record<string, boolean>>,
  key: string | undefined,
  defaultEnabled: boolean,
): boolean {
  return key ? (overrides[key] ?? defaultEnabled) : defaultEnabled;
}

export function updatePlaylistAudioOnlyOverrides(
  overrides: Record<string, boolean>,
  key: string,
  enabled: boolean,
): Record<string, boolean> {
  return Object.fromEntries([
    ...Object.entries(overrides)
      .filter(([entryKey]) => entryKey !== key)
      .slice(-31),
    [key, enabled],
  ]);
}

const useAudioOnlyStore = create<State>((set) => ({
  overrides: {},
  setEnabled: (key, enabled) =>
    set((state) => ({
      overrides: updatePlaylistAudioOnlyOverrides(state.overrides, key, enabled),
    })),
}));

export function usePlaylistAudioOnly(playlistId: string | undefined, defaultEnabled: boolean) {
  const userId = useAuthStore((state) => state.me?.id ?? "anonymous");
  const key = playlistId ? playlistAudioOnlyKey(userId, playlistId) : undefined;
  const overrides = useAudioOnlyStore((state) => state.overrides);
  const setEnabled = useAudioOnlyStore((state) => state.setEnabled);
  const enabled = resolvePlaylistAudioOnly(overrides, key, defaultEnabled);

  return {
    enabled,
    toggle: () => {
      if (key) setEnabled(key, !enabled);
    },
  };
}
