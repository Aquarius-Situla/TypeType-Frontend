import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FocusSettingsRequest, fetchFocus, saveFocus } from "../lib/api-focus";
import { SUBSCRIPTION_FEED_KEY } from "../lib/subscription-queries";
import { useAuth } from "./use-auth";
import { HOME_RECOMMENDATIONS_KEY } from "./use-recommender";

const FOCUS_KEY = ["focus"];

export function useFocus() {
  const { authReady, isAuthed, me } = useAuth();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...FOCUS_KEY, me?.id],
    queryFn: ({ signal }) => fetchFocus(signal),
    enabled: authReady && isAuthed,
  });
  const save = useMutation({
    mutationFn: (request: FocusSettingsRequest) => saveFocus(request),
    onSuccess: (settings) => {
      client.setQueryData([...FOCUS_KEY, me?.id], settings);
      client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY });
      client.invalidateQueries({ queryKey: SUBSCRIPTION_FEED_KEY });
      client.invalidateQueries({ queryKey: ["channel"] });
    },
  });
  return { query, save };
}
