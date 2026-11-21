import {
  QueryClient,
  QueryClientContext,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext } from "react";
import {
  addFocusStudyChannel,
  type FocusSettingsRequest,
  type FocusStudyChannelRequest,
  fetchFocus,
  removeFocusStudyChannel,
  saveFocus,
} from "../lib/api-focus";
import { invalidateSubscriptionQueries, SUBSCRIPTION_FEED_KEY } from "../lib/subscription-queries";
import { useAuth } from "./use-auth";
import { HOME_RECOMMENDATIONS_KEY } from "./use-recommender";

const FOCUS_KEY = ["focus"];
const NO_PROVIDER_QUERY_CLIENT = new QueryClient();

export function useFocus() {
  const { authReady, isAuthed, me } = useAuth();
  const contextClient = useContext(QueryClientContext);
  const client = contextClient ?? NO_PROVIDER_QUERY_CLIENT;
  const query = useQuery(
    {
      queryKey: [...FOCUS_KEY, me?.id],
      queryFn: ({ signal }) => fetchFocus(signal),
      enabled: Boolean(contextClient) && authReady && isAuthed,
    },
    client,
  );
  const save = useMutation(
    {
      mutationFn: (request: FocusSettingsRequest) => saveFocus(request),
      onSuccess: (settings) => {
        client.setQueryData([...FOCUS_KEY, me?.id], settings);
        client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY });
        client.invalidateQueries({ queryKey: SUBSCRIPTION_FEED_KEY });
        client.invalidateQueries({ queryKey: ["channel"] });
        client.invalidateQueries({ queryKey: ["stream"] });
      },
    },
    client,
  );
  return { query, save };
}

export function useAddFocusStudyChannel() {
  const { me } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: FocusStudyChannelRequest) => addFocusStudyChannel(request),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [...FOCUS_KEY, me?.id] });
      void invalidateSubscriptionQueries(client, "subscriptions");
      client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY });
      client.invalidateQueries({ queryKey: ["channel"] });
      client.invalidateQueries({ queryKey: ["stream"] });
    },
  });
}

export function useRemoveFocusStudyChannel() {
  const { me } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (channelUrl: string) => removeFocusStudyChannel(channelUrl),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: [...FOCUS_KEY, me?.id] });
      void invalidateSubscriptionQueries(client, "subscriptions");
      client.invalidateQueries({ queryKey: HOME_RECOMMENDATIONS_KEY });
      client.invalidateQueries({ queryKey: ["channel"] });
      client.invalidateQueries({ queryKey: ["stream"] });
    },
  });
}
