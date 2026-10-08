import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AiSubtitleTrack = {
  vtt: string;
  languageTag: string;
  displayLanguageName: string;
  generatedAt: number;
};

type AiSubtitlesStore = {
  endpoint: string;
  apiKey: string;
  model: string;
  targetLanguage: string;
  customPrompt: string;
  cachedTracks: Record<string, AiSubtitleTrack>;
  setEndpoint: (endpoint: string) => void;
  setApiKey: (apiKey: string) => void;
  setModel: (model: string) => void;
  setTargetLanguage: (targetLanguage: string) => void;
  setCustomPrompt: (prompt: string) => void;
  cacheTrack: (streamId: string, track: AiSubtitleTrack) => void;
  getCachedTrack: (streamId: string) => AiSubtitleTrack | undefined;
  clearCache: () => void;
};

export const useAiSubtitlesStore = create<AiSubtitlesStore>()(
  persist(
    (set, get) => ({
      endpoint: "https://api.openai.com/v1",
      apiKey: "",
      model: "gpt-4o-mini",
      targetLanguage: "zh",
      customPrompt: "",
      cachedTracks: {},
      setEndpoint: (endpoint) => set({ endpoint: endpoint.trim() }),
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setModel: (model) => set({ model: model.trim() }),
      setTargetLanguage: (targetLanguage) => set({ targetLanguage }),
      setCustomPrompt: (customPrompt) => set({ customPrompt }),
      cacheTrack: (streamId, track) =>
        set((state) => ({
          cachedTracks: {
            ...state.cachedTracks,
            [streamId]: track,
          },
        })),
      getCachedTrack: (streamId) => get().cachedTracks[streamId],
      clearCache: () => set({ cachedTracks: {} }),
    }),
    {
      name: "typed-ai-subtitles",
    },
  ),
);
