import type {
  AlgorithmList,
  AlgorithmProfile,
  RecommenderDataCategory,
  RecommenderFeedback,
  RecommenderFeedbackRequest,
  RecommenderPageTrace,
  RecommenderSettings,
} from "../types/recommender";
import { authed, authedJson } from "./authed";
import { clientTimezone } from "./client-timezone";
import { API_BASE as BASE } from "./env";

const JSON_HEADERS = { "Content-Type": "application/json" };

function localized(path: string, locale: string): string {
  const search = new URLSearchParams({ locale, timezone: clientTimezone() });
  return `${BASE}${path}?${search.toString()}`;
}

export async function fetchRecommenderAlgorithms(locale: string): Promise<AlgorithmList> {
  return authedJson(localized("/recommendations/algorithms", locale));
}

export async function fetchRecommenderSettings(): Promise<RecommenderSettings> {
  return authedJson(`${BASE}/recommendations/settings`);
}

export async function saveRecommenderSettings(
  settings: RecommenderSettings,
): Promise<RecommenderSettings> {
  return authedJson(`${BASE}/recommendations/settings`, {
    method: "PUT",
    headers: JSON_HEADERS,
    body: JSON.stringify(settings),
  });
}

export async function fetchRecommenderProfile(locale: string): Promise<AlgorithmProfile> {
  return authedJson(localized("/recommendations/profile", locale));
}

export async function fetchRecommenderData(): Promise<RecommenderDataCategory[]> {
  return authedJson(`${BASE}/recommendations/data`);
}

export async function fetchRecommenderLastHome(): Promise<RecommenderPageTrace | null> {
  const response = await authed(`${BASE}/recommendations/last-home`);
  if (!response.ok) return null;
  const trace: RecommenderPageTrace = await response.json();
  return trace;
}

export async function fetchRecommenderFeedback(): Promise<RecommenderFeedback[]> {
  return authedJson(`${BASE}/recommendations/feedback`);
}

export async function sendRecommenderFeedback(
  feedback: RecommenderFeedbackRequest,
): Promise<RecommenderFeedback> {
  return authedJson(`${BASE}/recommendations/feedback`, {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(feedback),
  });
}

export async function deleteRecommenderFeedback(id: string): Promise<void> {
  await authed(`${BASE}/recommendations/feedback/${encodeURIComponent(id)}`, { method: "DELETE" });
}
