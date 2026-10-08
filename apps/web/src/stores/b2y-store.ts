import { create } from "zustand";
import { persist } from "zustand/middleware";

export type B2YLink = {
  bilibiliUrlOrBv: string;
  bilibiliTitle?: string;
  offsetSeconds: number;
  updatedAt: number;
};

type B2YStore = {
  links: Record<string, B2YLink>;
  setLink: (
    youtubeId: string,
    bilibiliUrlOrBv: string,
    bilibiliTitle?: string,
    offsetSeconds?: number,
  ) => void;
  setOffset: (youtubeId: string, offsetSeconds: number) => void;
  removeLink: (youtubeId: string) => void;
  getLink: (youtubeId: string) => B2YLink | undefined;
};

export function normalizeBilibiliTarget(input: string): string {
  const trimmed = input.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  const bvMatch = trimmed.match(/^(BV[a-zA-Z0-9]+)/i);
  if (bvMatch) {
    return `https://www.bilibili.com/video/${bvMatch[1]}`;
  }
  if (trimmed.startsWith("av") || trimmed.startsWith("AV")) {
    return `https://www.bilibili.com/video/${trimmed}`;
  }
  return trimmed;
}

export const useB2YStore = create<B2YStore>()(
  persist(
    (set, get) => ({
      links: {},
      setLink: (youtubeId, bilibiliUrlOrBv, bilibiliTitle, offsetSeconds = 0) =>
        set((state) => ({
          links: {
            ...state.links,
            [youtubeId]: {
              bilibiliUrlOrBv: bilibiliUrlOrBv.trim(),
              bilibiliTitle,
              offsetSeconds,
              updatedAt: Date.now(),
            },
          },
        })),
      setOffset: (youtubeId, offsetSeconds) =>
        set((state) => {
          const current = state.links[youtubeId];
          if (!current) return state;
          return {
            links: {
              ...state.links,
              [youtubeId]: {
                ...current,
                offsetSeconds,
                updatedAt: Date.now(),
              },
            },
          };
        }),
      removeLink: (youtubeId) =>
        set((state) => {
          const next = { ...state.links };
          delete next[youtubeId];
          return { links: next };
        }),
      getLink: (youtubeId) => get().links[youtubeId],
    }),
    {
      name: "typed-b2y",
    },
  ),
);
