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
import { SettingsWriteQueue } from "../lib/settings-write-queue";
import { DEFAULT_SPONSORBLOCK_CATEGORY_ACTIONS } from "../lib/sponsorblock-settings";
import {
  DEFAULT_LANDING_STORAGE_KEY,
  HIDE_HOME_STORAGE_KEY,
  syncStoredLandingSettings,
} from "../lib/default-landing";
import type { SettingsItem } from "../types/user";
import { useAuth } from "./use-auth";

const KEY = ["settings"];
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

export const SETTINGS_CACHE_KEY = "typetype-settings-cache";

function readAudioOnlyPlayback(): boolean | null {
  const stored = localStorage.getItem(AUDIO_ONLY_STORAGE_KEY);
  if (stored === "true") return true;
  if (stored === "false") return false;
  return null;
}

function writeAudioOnlyPlayback(value: boolean): void {
  localStorage.setItem(AUDIO_ONLY_STORAGE_KEY, String(value));
}

export function readCachedSettings(): SettingsItem {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(SETTINGS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        return { ...DEFAULTS, ...parsed };
      }
    }
  } catch {}
  return DEFAULTS;
}

export function writeCachedSettings(settings: SettingsItem): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(SETTINGS_CACHE_KEY, JSON.stringify(settings));
    syncStoredLandingSettings(settings.defaultLandingPage, settings.hideHomeRecommendations);
  } catch {}
}

function withLocalSettings(settings: SettingsItem): SettingsItem {
  const audioOnlyPlayback = readAudioOnlyPlayback();
  const storedLanding = localStorage.getItem(DEFAULT_LANDING_STORAGE_KEY);
  const storedHideHome = localStorage.getItem(HIDE_HOME_STORAGE_KEY);
  return {
    ...settings,
    ...(audioOnlyPlayback !== null ? { audioOnlyPlayback } : {}),
    ...(storedLanding ? { defaultLandingPage: storedLanding } : {}),
    ...(storedHideHome !== null ? { hideHomeRecommendations: storedHideHome === "true" } : {}),
  };
}

export function useSettings({ forceAnonymous = false }: UseSettingsOptions = {}) {
  const qc = useQueryClient();
  const writeQueue = getWriteQueue(qc);
  const { authReady, isAuthed } = useAuth();
  const useAccountSettings = isAuthed && !forceAnonymous;

  const query = useQuery({
    queryKey: KEY,
    queryFn: async () => {
      const data = await fetchSettings();
      writeCachedSettings(data);
      return data;
    },
    enabled: authReady && useAccountSettings,
    placeholderData: () => readCachedSettings(),
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (query.data && !query.isPlaceholderData) {
      writeCachedSettings(query.data);
    }
  }, [query.data, query.isPlaceholderData]);

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
          writeCachedSettings(settings);
          qc.setQueryData<SettingsItem>(KEY, settings);
        },
      ),
    onMutate: async ({ patch }) => {
      await qc.cancelQueries({ queryKey: KEY });
      if (typeof patch.audioOnlyPlayback === "boolean")
        writeAudioOnlyPlayback(patch.audioOnlyPlayback);
      if (patch.defaultLandingPage !== undefined || patch.hideHomeRecommendations !== undefined) {
        syncStoredLandingSettings(patch.defaultLandingPage, patch.hideHomeRecommendations);
      }
      const previous = qc.getQueryData<SettingsItem>(KEY) ?? readCachedSettings();
      const next = { ...DEFAULTS, ...previous, ...patch };
      writeCachedSettings(next);
      qc.setQueryData<SettingsItem>(KEY, next);
      return { patch };
    },
    onSuccess: (data, _variables, context) => {
      const current = qc.getQueryData<SettingsItem>(KEY);
      const next = { ...DEFAULTS, ...data, ...context?.patch, ...current };
      writeCachedSettings(next);
      qc.setQueryData<SettingsItem>(KEY, next);
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
    const base = { ...DEFAULTS, ...qc.getQueryData<SettingsItem>(KEY) };
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

  const baseSettings = query.data ?? readCachedSettings();
  const settings = withLocalSettings(baseSettings ? { ...DEFAULTS, ...baseSettings } : DEFAULTS);

  return { query, update, settings, settingsReady };
}
