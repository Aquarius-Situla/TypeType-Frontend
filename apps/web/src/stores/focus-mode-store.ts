import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FocusModeState = {
  enabled: boolean;
  startedAt: number;
  transitionDays: number;
  studyGroupId: string | null;
  entertainmentGroupId: string | null;
  hideOldEntertainmentDays: number;
  setEnabled: (enabled: boolean) => void;
  setTransitionDays: (days: number) => void;
  setStudyGroupId: (id: string | null) => void;
  setEntertainmentGroupId: (id: string | null) => void;
  setHideOldEntertainmentDays: (days: number) => void;
  resetProgress: () => void;
};

export const useFocusModeStore = create<FocusModeState>()(
  persist(
    (set) => ({
      enabled: false,
      startedAt: Date.now(),
      transitionDays: 90,
      studyGroupId: null,
      entertainmentGroupId: null,
      hideOldEntertainmentDays: 7,
      setEnabled: (enabled) =>
        set((state) => ({
          enabled,
          startedAt: enabled && !state.enabled ? Date.now() : state.startedAt,
        })),
      setTransitionDays: (transitionDays) => set({ transitionDays: Math.max(1, transitionDays) }),
      setStudyGroupId: (studyGroupId) => set({ studyGroupId }),
      setEntertainmentGroupId: (entertainmentGroupId) => set({ entertainmentGroupId }),
      setHideOldEntertainmentDays: (hideOldEntertainmentDays) =>
        set({ hideOldEntertainmentDays: Math.max(1, hideOldEntertainmentDays) }),
      resetProgress: () => set({ startedAt: Date.now() }),
    }),
    {
      name: "typed-focus-mode",
    },
  ),
);

/**
 * Calculates current entertainment recommendation weight between 0.0 (fully eliminated) and 1.0 (unrestricted).
 */
export function getEntertainmentWeight(state: {
  enabled: boolean;
  startedAt: number;
  transitionDays: number;
}): number {
  if (!state.enabled) return 1.0;
  const elapsedMs = Math.max(0, Date.now() - state.startedAt);
  const totalMs = Math.max(1, state.transitionDays) * 86_400_000;
  const progress = Math.min(1.0, elapsedMs / totalMs);
  return Math.max(0, 1.0 - progress);
}

/**
 * Deterministically decides whether an entertainment item should be filtered out based on its unique key.
 * This guarantees stable feed rendering without content jumping.
 */
export function shouldFilterEntertainment(
  state: { enabled: boolean; startedAt: number; transitionDays: number },
  itemKey: string,
): boolean {
  if (!state.enabled) return false;
  const weight = getEntertainmentWeight(state);
  if (weight <= 0) return true; // Completely eliminated
  if (weight >= 1) return false; // Full visibility

  // Deterministic 32-bit hash of itemKey to get a uniform float [0, 1)
  let hash = 0;
  for (let i = 0; i < itemKey.length; i++) {
    hash = (hash << 5) - hash + itemKey.charCodeAt(i);
    hash |= 0;
  }
  const normalized = (Math.abs(hash) % 10_000) / 10_000;
  return normalized >= weight;
}

/**
 * Checks if a video's upload timestamp exceeds the focus mode entertainment window (default: 7 days).
 */
export function isEntertainmentVideoOld(uploadedTimestampMs: number, maxDays = 7): boolean {
  if (!Number.isFinite(uploadedTimestampMs) || uploadedTimestampMs <= 0) return false;
  const cutoff = Date.now() - maxDays * 86_400_000;
  return uploadedTimestampMs < cutoff;
}
