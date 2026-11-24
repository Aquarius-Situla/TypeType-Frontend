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
  cancelFocusAllowOncePending,
  type FocusAllowOnceCancelResponse,
  type FocusAllowOnceChallengeRequest,
  type FocusAllowOnceChallengeResponse,
  type FocusAllowOnceKind,
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

function applyAllowOnceQuota(
  prev: FocusSettings | undefined,
  kind: FocusAllowOnceKind | undefined,
  remainingToday: number,
  dailyLimit: number,
): FocusSettings | undefined {
  if (!prev) return prev;
  if (kind === "entertainment_rewatch") {
    return {
      ...prev,
      rewatchAllowOnceRemainingToday: remainingToday,
      rewatchAllowOnceDailyLimit: dailyLimit,
    };
  }
  return {
    ...prev,
    allowOnceRemainingToday: remainingToday,
    allowOnceDailyLimit: dailyLimit,
  };
}

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
        client.invalidateQueries({ queryKey: ["stream-bootstrap"] });
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
      client.invalidateQueries({ queryKey: ["stream-bootstrap"] });
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
      client.invalidateQueries({ queryKey: ["stream-bootstrap"] });
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
    onSuccess: (challenge, request) => {
      client.setQueryData<FocusSettings>([...FOCUS_KEY, me?.id], (prev) =>
        applyAllowOnceQuota(
          prev,
          challenge.kind ?? request.kind,
          challenge.remainingToday,
          challenge.dailyLimit,
        ),
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
    onSuccess: (result, request) => {
      client.setQueryData<FocusSettings>([...FOCUS_KEY, me?.id], (prev) =>
        applyAllowOnceQuota(
          prev,
          result.kind ?? request.kind,
          result.remainingToday,
          result.dailyLimit,
        ),
      );
      client.invalidateQueries({ queryKey: [...FOCUS_KEY, me?.id] });
    },
  });
}

export function useCancelFocusAllowOncePending(): UseMutationResult<
  FocusAllowOnceCancelResponse,
  Error,
  string
> {
  const { me } = useAuth();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (videoUrl: string) => cancelFocusAllowOncePending(videoUrl, clientTimezone()),
    onSuccess: (result) => {
      client.setQueryData<FocusSettings>([...FOCUS_KEY, me?.id], (prev) =>
        applyAllowOnceQuota(prev, result.kind, result.remainingToday, result.dailyLimit),
      );
      client.invalidateQueries({ queryKey: [...FOCUS_KEY, me?.id] });
    },
  });
}
