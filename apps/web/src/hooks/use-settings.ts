import {
  type MutateOptions,
  type QueryClient,
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useEffect } from "react";
import { fetchSettings, updateSettings } from "../lib/api-user";
import { EMPTY_CAPTION_STYLES } from "../lib/caption-styles";
import { readStoredLandingSettings, syncStoredLandingSettings } from "../lib/default-landing";
import { readSettingsCache, writeSettingsCache } from "../lib/settings-cache";
import { SettingsWriteQueue } from "../lib/settings-write-queue";
import { DEFAULT_SPONSORBLOCK_CATEGORY_ACTIONS } from "../lib/sponsorblock-settings";
import type { SettingsItem } from "../types/user";
import { useAuth } from "./use-auth";

const AUDIO_ONLY_STORAGE_KEY = "typetype-audio-only-playback";
const writeQueues = new WeakMap<QueryClient, SettingsWriteQueue>();

type UseSettingsOptions = {
  forceAnonymous?: boolean;
};

type QueuedSettingsPatch = {
  id: number;
  base: SettingsItem;
  patch: Partial<SettingsItem>;
};

type SettingsMutationContext = {
  patch: Partial<SettingsItem>;
};

type PublicMutateOptions = MutateOptions<
  SettingsItem,
  Error,
  Partial<SettingsItem>,
  SettingsMutationContext
>;

type PublicSettingsMutation = Omit<
  UseMutationResult<SettingsItem, Error, QueuedSettingsPatch, SettingsMutationContext>,
  "mutate" | "mutateAsync"
> & {
  mutate: (patch: Partial<SettingsItem>, options?: PublicMutateOptions) => void;
  mutateAsync: (
    patch: Partial<SettingsItem>,
    options?: PublicMutateOptions,
  ) => Promise<SettingsItem>;
};

type QueuedMutateOptions = MutateOptions<
  SettingsItem,
  Error,
  QueuedSettingsPatch,
  SettingsMutationContext
>;

function getWriteQueue(client: QueryClient): SettingsWriteQueue {
  const existing = writeQueues.get(client);
  if (existing) return existing;
  const queue = new SettingsWriteQueue();
  writeQueues.set(client, queue);
  return queue;
}

const DEFAULTS: SettingsItem = {
  defaultService: 0,
  defaultLandingPage: "home",
  defaultQuality: "1080p",
  defaultPlaybackSpeed: 1,
  autoplay: true,
  autoplayOnOpen: true,
  autoplayCountdownSeconds: 10,
  skipPlaylistAutoplayScreen: false,
  audioOnlyPlayback: false,
  videoGridColumns: 0,
  relatedVideoSize: "default",
  volume: 1,
  muted: false,
  notificationPopupsEnabled: true,
  subtitlesEnabled: false,
  defaultSubtitleLanguage: "",
  defaultAudioLanguage: "",
  preferOriginalLanguage: true,
  enableHighQualityPlayback: true,
  sponsorBlockMode: "auto_skip",
  sponsorBlockCategoryActions: DEFAULT_SPONSORBLOCK_CATEGORY_ACTIONS,
  sponsorBlockMinimumDuration: 0,
  sponsorBlockShowCurrentSegment: true,
  sponsorBlockShowChapters: false,
  sponsorBlockShowFullVideoLabels: true,
  sponsorBlockManualSkipOnFullVideo: true,
  sponsorBlockSkipNonMusicOnlyOnMusicVideos: false,
  sponsorBlockMuteInsteadOfSkip: false,
  disableWatchHistory: false,
  deArrowEnabled: false,
  deArrowTitleMode: "dearrow",
  deArrowThumbnailMode: "dearrow_or_random",
  deArrowTrustMode: "accepted",
  hideContinueWatching: false,
  hideHomeRecommendations: false,
  hideRelatedVideos: false,
  hideComments: false,
  hideShorts: false,
  hideSubscriptionLiveStreams: false,
  hideMembersOnlyContent: false,
  accessMode: "unrestricted",
  captionStyles: EMPTY_CAPTION_STYLES,
};

function readAudioOnlyPlayback(): boolean | null {
  const stored = localStorage.getItem(AUDIO_ONLY_STORAGE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return null;
}

function writeAudioOnlyPlayback(value: boolean): void {
  localStorage.setItem(AUDIO_ONLY_STORAGE_KEY, String(value));
}

export function readCachedSettings(userId?: string | null): SettingsItem {
  return { ...DEFAULTS, ...readSettingsCache(userId) };
}

export function writeCachedSettings(settings: SettingsItem, userId?: string | null): void {
  writeSettingsCache(settings, userId);
  syncStoredLandingSettings(settings.defaultLandingPage, settings.hideHomeRecommendations, userId);
}

function withLocalSettings(settings: SettingsItem, userId?: string | null): SettingsItem {
  const audioOnlyPlayback = readAudioOnlyPlayback();
  const storedLanding = readStoredLandingSettings(userId);
  return {
    ...settings,
    ...(audioOnlyPlayback !== null ? { audioOnlyPlayback } : {}),
    ...storedLanding,
  };
}

export function useSettings({ forceAnonymous = false }: UseSettingsOptions = {}) {
  const qc = useQueryClient();
  const writeQueue = getWriteQueue(qc);
  const { authReady, isAuthed, me } = useAuth();
  const userId = me?.id ?? null;
  const useAccountSettings = isAuthed && !forceAnonymous;
  const queryKey = ["settings", userId] as const;

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      const data = await fetchSettings();
      writeCachedSettings(data, userId);
      return data;
    },
    enabled: authReady && useAccountSettings,
    placeholderData: () => readCachedSettings(userId),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data && !query.isPlaceholderData) {
      writeCachedSettings(query.data, userId);
    }
  }, [query.data, query.isPlaceholderData, userId]);

  const settingsReady =
    forceAnonymous ||
    (authReady && !isAuthed) ||
    (query.isSuccess && !query.isPlaceholderData) ||
    query.isError;

  const mutation = useMutation<SettingsItem, Error, QueuedSettingsPatch, SettingsMutationContext>({
    mutationFn: ({ id, base }) =>
      writeQueue.execute(
        id,
        (settings) => (useAccountSettings ? updateSettings(settings) : Promise.resolve(settings)),
        () => base,
        (settings) => {
          writeCachedSettings(settings, userId);
          qc.setQueryData<SettingsItem>(queryKey, settings);
        },
      ),
    onMutate: async ({ patch }) => {
      await qc.cancelQueries({ queryKey });
      if (typeof patch.audioOnlyPlayback === "boolean")
        writeAudioOnlyPlayback(patch.audioOnlyPlayback);
      if (patch.defaultLandingPage !== undefined || patch.hideHomeRecommendations !== undefined) {
        syncStoredLandingSettings(patch.defaultLandingPage, patch.hideHomeRecommendations, userId);
      }
      const previous = qc.getQueryData<SettingsItem>(queryKey) ?? readCachedSettings(userId);
      const next = { ...DEFAULTS, ...previous, ...patch };
      writeCachedSettings(next, userId);
      qc.setQueryData<SettingsItem>(queryKey, next);
      return { patch };
    },
    onSuccess: (data, _variables, context) => {
      const current = qc.getQueryData<SettingsItem>(queryKey);
      const next = { ...DEFAULTS, ...data, ...context?.patch, ...current };
      writeCachedSettings(next, userId);
      qc.setQueryData<SettingsItem>(queryKey, next);
      if (
        context?.patch.hideSubscriptionLiveStreams !== undefined ||
        context?.patch.hideMembersOnlyContent !== undefined
      ) {
        void qc.resetQueries({ queryKey: ["subscription-feed"] });
      }
    },
    onError: (err) => {
      console.error("[settings] PUT failed", err);
    },
  });

  function queuePatch(patch: Partial<SettingsItem>): QueuedSettingsPatch {
    const normalizedPatch = { ...patch };
    const base = { ...DEFAULTS, ...qc.getQueryData<SettingsItem>(queryKey) };
    const id = writeQueue.stage(normalizedPatch, base);
    return { id, base, patch: normalizedPatch };
  }

  function mapOptions(options?: PublicMutateOptions): QueuedMutateOptions | undefined {
    if (!options) return undefined;
    return {
      onSuccess: (data, variables, context, mutationContext) =>
        options.onSuccess?.(data, variables.patch, context, mutationContext),
      onError: (error, variables, context, mutationContext) =>
        options.onError?.(error, variables.patch, context, mutationContext),
      onSettled: (data, error, variables, context, mutationContext) =>
        options.onSettled?.(data, error, variables.patch, context, mutationContext),
    };
  }

  const update: PublicSettingsMutation = {
    ...mutation,
    mutate: (patch, options) => mutation.mutate(queuePatch(patch), mapOptions(options)),
    mutateAsync: (patch, options) => mutation.mutateAsync(queuePatch(patch), mapOptions(options)),
  };

  const baseSettings = query.data ?? readCachedSettings(userId);
  const settings = withLocalSettings(
    baseSettings ? { ...DEFAULTS, ...baseSettings } : DEFAULTS,
    userId,
  );

  return { query, update, settings, settingsReady };
}
