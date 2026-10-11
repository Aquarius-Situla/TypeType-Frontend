import type { RecommenderAdminFeedback, RecommenderAdminStatus } from "../types/admin";
import { authedJson } from "./authed";
import { API_BASE as BASE } from "./env";

export async function fetchRecommenderAdminStatus(locale: string): Promise<RecommenderAdminStatus> {
  const search = new URLSearchParams({ locale });
  return authedJson(`${BASE}/admin/recommender/status?${search.toString()}`);
}

export async function fetchRecommenderAdminFeedback(): Promise<RecommenderAdminFeedback> {
  return authedJson(`${BASE}/admin/recommender/feedback`);
}
