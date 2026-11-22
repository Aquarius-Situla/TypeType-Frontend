import {
  QueryClient,
  QueryClientContext,
  type UseMutationResult,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useContext } from "react";
import {
  addFocusStudyChannel,
  type FocusAllowOnceChallengeRequest,
  type FocusAllowOnceChallengeResponse,
  type FocusAllowOnceVerifyRequest,
  type FocusAllowOnceVerifyResponse,
  type FocusSettings,
  type FocusSettingsRequest,
  type FocusStudyChannelRequest,
  fetchFocus,
  removeFocusStudyChannel,
  requestFocusAllowOnceChallenge,
  saveFocus,
  verifyFocusAllowOnce,
} from "../lib/api-focus";
import { clientTimezone } from "../lib/client-timezone";
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
      queryFn: ({ signal }) => fetchFocus(signal, clientTimezone()),
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

export function useRequestFocusAllowOnceChallenge(): UseMutationResult<
  FocusAllowOnceChallengeResponse,
  Error,
  FocusAllowOnceChallengeRequest
> {
  const { me } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: FocusAllowOnceChallengeRequest) =>
      requestFocusAllowOnceChallenge({ timezone: clientTimezone(), ...request }),
    onSuccess: (challenge) => {
      client.setQueryData<FocusSettings>([...FOCUS_KEY, me?.id], (prev) =>
        prev
          ? {
              ...prev,
              allowOnceRemainingToday: challenge.remainingToday,
              allowOnceDailyLimit: challenge.dailyLimit,
            }
          : prev,
      );
    },
    onError: () => {
      client.invalidateQueries({ queryKey: [...FOCUS_KEY, me?.id] });
    },
  });
}

export function useVerifyFocusAllowOnce(): UseMutationResult<
  FocusAllowOnceVerifyResponse,
  Error,
  FocusAllowOnceVerifyRequest
> {
  const { me } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (request: FocusAllowOnceVerifyRequest) =>
      verifyFocusAllowOnce({ timezone: clientTimezone(), ...request }),
    onSuccess: (result) => {
      client.setQueryData<FocusSettings>([...FOCUS_KEY, me?.id], (prev) =>
        prev
          ? {
              ...prev,
              allowOnceRemainingToday: result.remainingToday,
              allowOnceDailyLimit: result.dailyLimit,
            }
          : prev,
      );
      client.invalidateQueries({ queryKey: [...FOCUS_KEY, me?.id] });
    },
  });
}
