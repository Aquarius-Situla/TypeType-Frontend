import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscribe, unsubscribe } from "../lib/api-user";
import { normalizeChannelUrl } from "../lib/channel-url";
import {
  invalidateSubscriptionQueries,
  subscriptionsQueryOptions,
} from "../lib/subscription-queries";
import type { SubscriptionItem } from "../types/user";
import { useAuth } from "./use-auth";

function hasSubscription(data: SubscriptionItem[] | undefined, channelUrl: string): boolean {
  const target = normalizeChannelUrl(channelUrl);
  return (data ?? []).some((item) => normalizeChannelUrl(item.channelUrl) === target);
}

function dedupeSubscriptions(data: SubscriptionItem[]): SubscriptionItem[] {
  const kept = new Set<string>();
  const output: SubscriptionItem[] = [];
  for (const item of data) {
    const normalized = normalizeChannelUrl(item.channelUrl);
    if (kept.has(normalized)) continue;
    kept.add(normalized);
    output.push(item);
  }
  return output;
}

export function useSubscriptions(filter = "all") {
  const qc = useQueryClient();
  const { authReady, isAuthed } = useAuth();

  const query = useQuery({
    ...subscriptionsQueryOptions(filter),
    enabled: authReady && isAuthed,
    select: dedupeSubscriptions,
  });

  const add = useMutation({
    mutationFn: (item: Omit<SubscriptionItem, "subscribedAt">) => {
      if (!isAuthed) return Promise.resolve();
      if (hasSubscription(query.data, item.channelUrl)) return Promise.resolve();
      return subscribe({
        ...item,
        channelUrl: normalizeChannelUrl(item.channelUrl),
      });
    },
    onSuccess: () => invalidateSubscriptionQueries(qc),
  });

  const remove = useMutation({
    mutationFn: (channelUrl: string) => (isAuthed ? unsubscribe(channelUrl) : Promise.resolve()),
    onSuccess: () => invalidateSubscriptionQueries(qc),
  });

  function isSubscribed(channelUrl: string): boolean {
    return hasSubscription(query.data, channelUrl);
  }

  return { query, add, remove, isSubscribed };
}
