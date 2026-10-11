import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRecommenderFeedback,
  fetchRecommenderFeedback,
  sendRecommenderFeedback,
} from "../lib/api-recommender";
import { profileScopedQueryKey } from "../lib/profile-scoped-query-key";
import { useAuth } from "./use-auth";
import { HOME_RECOMMENDATIONS_KEY, useRecommenderAvailable } from "./use-recommender";

export function useRecommenderFeedback(listed = true) {
  const available = useRecommenderAvailable();
  const { me } = useAuth();
  const profileId = me?.id ?? null;
  const client = useQueryClient();
  const feedbackKey = profileScopedQueryKey(["recommender", "feedback"], profileId);
  const list = useQuery({
    queryKey: feedbackKey,
    queryFn: fetchRecommenderFeedback,
    enabled: available && profileId !== null && listed,
    staleTime: 60 * 1000,
  });
  // Giving an opinion never asks for the home page again: the card is taken off where it is.
  // Taking one back does, and it is cheap: Server puts the video back on the page it kept.
  const send = useMutation({
    mutationFn: sendRecommenderFeedback,
    onSuccess: () => client.invalidateQueries({ queryKey: feedbackKey }),
  });
  const remove = useMutation({
    mutationFn: deleteRecommenderFeedback,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: feedbackKey });
      client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY });
    },
  });
  return { items: list.data ?? [], isLoading: list.isLoading, send, remove };
}
