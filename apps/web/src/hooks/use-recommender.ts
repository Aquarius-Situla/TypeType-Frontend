import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchRecommenderAlgorithms,
  fetchRecommenderProfile,
  fetchRecommenderSettings,
  saveRecommenderSettings,
} from "../lib/api-recommender";
import { getLocale } from "../paraglide/runtime.js";
import type { AlgorithmInfo, ParameterValue, RecommenderSettings } from "../types/recommender";
import { useAuth } from "./use-auth";
import { useInstance } from "./use-instance";

const RECOMMENDER_SETTINGS_KEY = ["recommender", "settings"] as const;
const PROFILE_KEY = ["recommender", "profile"] as const;
export const HOME_RECOMMENDATIONS_KEY = ["home-recommendations"] as const;

// A change shows at once; it is sent once the person has stopped clicking, so that trying
// three values in a row does not make Server build three home pages.
const SAVE_DELAY_MS = 700;
export const MAX_INTERESTS = 10;
export const MAX_INTEREST_CHARS = 60;
let pendingSave: ReturnType<typeof setTimeout> | null = null;

const NO_SETTINGS: RecommenderSettings = {
  enabled: false,
  algorithmId: null,
  parameters: {},
  mutedGroups: [],
  ignoredSignals: [],
  pinnedGroups: [],
  sessionResetAt: null,
  customInterests: [],
  unusedData: [],
  excludedItems: [],
  retentionDays: {},
};

export function useRecommenderAvailable(): boolean {
  const { isAuthed } = useAuth();
  const instance = useInstance();
  return isAuthed && instance.data?.recommender.enabled === true;
}

function toggled(list: string[], id: string): string[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}

export function useRecommender() {
  const available = useRecommenderAvailable();
  const client = useQueryClient();
  const locale = getLocale();
  const algorithms = useQuery({
    queryKey: ["recommender", "algorithms", locale],
    queryFn: () => fetchRecommenderAlgorithms(locale),
    enabled: available,
    staleTime: 10 * 60 * 1000,
  });
  const stored = useQuery({
    queryKey: RECOMMENDER_SETTINGS_KEY,
    queryFn: fetchRecommenderSettings,
    enabled: available,
    staleTime: 5 * 60 * 1000,
  });
  const settings = stored.data ?? NO_SETTINGS;
  const list = algorithms.data?.algorithms ?? [];
  const selectedId = settings.algorithmId ?? algorithms.data?.default_algorithm ?? list[0]?.id;
  const current: AlgorithmInfo | undefined = list.find((a) => a.id === selectedId) ?? list[0];
  const profile = useQuery({
    queryKey: [...PROFILE_KEY, locale, selectedId, settings],
    queryFn: () => fetchRecommenderProfile(locale),
    enabled: available && settings.enabled && Boolean(selectedId),
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });

  const save = useMutation({
    mutationFn: saveRecommenderSettings,
    onMutate: async (next) => {
      await client.cancelQueries({ queryKey: RECOMMENDER_SETTINGS_KEY });
      client.setQueryData(RECOMMENDER_SETTINGS_KEY, next);
    },
    // What is shown may already be several changes ahead: ask Server what it really kept.
    onError: () => client.invalidateQueries({ queryKey: RECOMMENDER_SETTINGS_KEY }),
    onSettled: () => client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY }),
  });
  const change = (patch: Partial<RecommenderSettings>, now = false) => {
    const next = { ...settings, ...patch };
    client.setQueryData(RECOMMENDER_SETTINGS_KEY, next);
    if (pendingSave !== null) clearTimeout(pendingSave);
    pendingSave = null;
    if (now) return save.mutate(next);
    pendingSave = setTimeout(() => {
      pendingSave = null;
      save.mutate(next);
    }, SAVE_DELAY_MS);
  };

  return {
    available,
    isLoading: algorithms.isLoading || stored.isLoading,
    isError: algorithms.isError || stored.isError,
    isRetrying: algorithms.isFetching || stored.isFetching,
    retry: () => {
      algorithms.refetch();
      stored.refetch();
    },
    algorithms: list,
    current,
    settings,
    profile: profile.data,
    profileLoading: profile.isLoading,
    profileRetrying: profile.isFetching,
    retryProfile: () => {
      profile.refetch();
    },
    valueFor: (id: string): ParameterValue | undefined =>
      settings.parameters[id] ?? current?.parameters.find((p) => p.id === id)?.default,
    setEnabled: (enabled: boolean) => change({ enabled }, true),
    select: (algorithmId: string) => change({ algorithmId, parameters: {} }, true),
    setValue: (id: string, value: ParameterValue) =>
      change({ parameters: { ...settings.parameters, [id]: value } }),
    resetValues: () => change({ parameters: {} }),
    toggleMuted: (id: string) => change({ mutedGroups: toggled(settings.mutedGroups, id) }),
    togglePinned: (id: string) => change({ pinnedGroups: toggled(settings.pinnedGroups, id) }),
    toggleIgnored: (id: string) => change({ ignoredSignals: toggled(settings.ignoredSignals, id) }),
    forgetRecent: () => change({ sessionResetAt: Date.now() }),
    addInterest: (text: string) => {
      const subject = text.trim().replace(/\s+/g, " ").slice(0, MAX_INTEREST_CHARS);
      const known = settings.customInterests ?? [];
      const same = (other: string) => other.toLowerCase() === subject.toLowerCase();
      if (!subject || known.some(same) || known.length >= MAX_INTERESTS) return;
      change({ customInterests: [...known, subject] }, true);
    },
    removeInterest: (text: string) =>
      change(
        {
          customInterests: (settings.customInterests ?? []).filter(
            (other) => other.toLowerCase() !== text.toLowerCase(),
          ),
        },
        true,
      ),
    toggleUse: (category: string) =>
      change({ unusedData: toggled(settings.unusedData ?? [], category) }),
    toggleExcluded: (item: string) =>
      change({ excludedItems: toggled(settings.excludedItems ?? [], item) }),
    setRetention: (category: string, days: number | null) => {
      const { [category]: _removed, ...others } = settings.retentionDays ?? {};
      change({ retentionDays: days === null ? others : { ...others, [category]: days } });
    },
  };
}

export type Recommender = ReturnType<typeof useRecommender>;

export function useHideInterest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const current =
        client.getQueryData<RecommenderSettings>(RECOMMENDER_SETTINGS_KEY) ??
        (await fetchRecommenderSettings());
      if (current.mutedGroups.includes(id)) return current;
      return saveRecommenderSettings({ ...current, mutedGroups: [...current.mutedGroups, id] });
    },
    onSuccess: (saved) => {
      client.setQueryData(RECOMMENDER_SETTINGS_KEY, saved);
      client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY });
    },
  });
}
