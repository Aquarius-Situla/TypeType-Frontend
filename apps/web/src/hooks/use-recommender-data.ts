import { useQuery } from "@tanstack/react-query";
import { fetchRecommenderData, fetchRecommenderLastHome } from "../lib/api-recommender";
import { profileScopedQueryKey } from "../lib/profile-scoped-query-key";
import type { RecommenderSettings } from "../types/recommender";
import { useAuth } from "./use-auth";
import { useRecommenderAvailable } from "./use-recommender";

export function useRecommenderData(settings: RecommenderSettings) {
  const available = useRecommenderAvailable();
  const { me } = useAuth();
  const profileId = me?.id ?? null;
  return useQuery({
    queryKey: profileScopedQueryKey(
      ["recommender", "data", settings.unusedData, settings.excludedItems, settings.retentionDays],
      profileId,
    ),
    queryFn: fetchRecommenderData,
    enabled: available && profileId !== null,
    staleTime: 60 * 1000,
  });
}

export function useRecommenderLastHome() {
  const available = useRecommenderAvailable();
  const { me } = useAuth();
  const profileId = me?.id ?? null;
  return useQuery({
    queryKey: profileScopedQueryKey(["recommender", "last-home"], profileId),
    queryFn: fetchRecommenderLastHome,
    enabled: available && profileId !== null,
    staleTime: 30 * 1000,
  });
}
