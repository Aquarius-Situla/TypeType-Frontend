import { useQuery } from "@tanstack/react-query";
import {
  fetchRecommenderAdminFeedback,
  fetchRecommenderAdminStatus,
} from "../lib/api-admin-recommender";
import { getLocale } from "../paraglide/runtime.js";

const STATUS_REFRESH_MS = 15_000;

export function useAdminRecommender(enabled: boolean) {
  const locale = getLocale();
  const status = useQuery({
    queryKey: ["admin-recommender", "status", locale],
    queryFn: () => fetchRecommenderAdminStatus(locale),
    enabled,
    refetchInterval: STATUS_REFRESH_MS,
  });
  const feedback = useQuery({
    queryKey: ["admin-recommender", "feedback"],
    queryFn: fetchRecommenderAdminFeedback,
    enabled,
  });
  return { status, feedback };
}
