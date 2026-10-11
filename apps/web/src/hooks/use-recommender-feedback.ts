import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteRecommenderFeedback,
  fetchRecommenderFeedback,
  sendRecommenderFeedback,
} from "../lib/api-recommender";
import { HOME_RECOMMENDATIONS_KEY, useRecommenderAvailable } from "./use-recommender";

const FEEDBACK_KEY = ["recommender", "feedback"] as const;

export function useRecommenderFeedback(listed = true) {
  const available = useRecommenderAvailable();
  const client = useQueryClient();
  const list = useQuery({
    queryKey: FEEDBACK_KEY,
    queryFn: fetchRecommenderFeedback,
    enabled: available && listed,
    staleTime: 60 * 1000,
  });
  // Giving an opinion never asks for the home page again: the card is taken off where it is.
  // Taking one back does, and it is cheap: Server puts the video back on the page it kept.
  const send = useMutation({
    mutationFn: sendRecommenderFeedback,
    onSuccess: () => client.invalidateQueries({ queryKey: FEEDBACK_KEY }),
  });
  const remove = useMutation({
    mutationFn: deleteRecommenderFeedback,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: FEEDBACK_KEY });
      client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY });
    },
  });
  return { items: list.data ?? [], isLoading: list.isLoading, send, remove };
}
