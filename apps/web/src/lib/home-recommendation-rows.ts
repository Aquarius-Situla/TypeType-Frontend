import type { HomeRecommendationRow } from "../types/recommender";

// Signals sends its own row of videos in progress; the "Continue watching" setting hides it like the web's own block.
export function visibleHomeRows(
  rows: HomeRecommendationRow[],
  hideContinueWatching: boolean,
): HomeRecommendationRow[] {
  return hideContinueWatching ? rows.filter((row) => row.reason !== "continue") : rows;
}
