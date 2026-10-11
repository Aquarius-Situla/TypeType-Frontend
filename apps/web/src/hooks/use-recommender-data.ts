import { useQuery } from "@tanstack/react-query";
import { fetchRecommenderData, fetchRecommenderLastHome } from "../lib/api-recommender";
import type { RecommenderSettings } from "../types/recommender";
import { useRecommenderAvailable } from "./use-recommender";

export function useRecommenderData(settings: RecommenderSettings) {
  const available = useRecommenderAvailable();
  return useQuery({
    queryKey: [
      "recommender",
      "data",
      settings.unusedData,
      settings.excludedItems,
      settings.retentionDays,
    ],
    queryFn: fetchRecommenderData,
    enabled: available,
    staleTime: 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useRecommenderLastHome() {
  const available = useRecommenderAvailable();
  return useQuery({
    queryKey: ["recommender", "last-home"],
    queryFn: fetchRecommenderLastHome,
    enabled: available,
    staleTime: 30 * 1000,
  });
}
