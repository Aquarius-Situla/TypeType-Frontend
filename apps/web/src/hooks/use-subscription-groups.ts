import { type UseQueryResult, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ApiError } from "../lib/api";
import { fetchSubscriptionGroups, MembershipUpdateError } from "../lib/api-subscription-groups";
import {
  invalidateSubscriptionQueries,
  SUBSCRIPTION_GROUPS_KEY,
} from "../lib/subscription-queries";
import { m } from "../paraglide/messages.js";
import type { SubscriptionGroup } from "../types/subscription-groups";
import { useAuth } from "./use-auth";

export function useSubscriptionGroups(): UseQueryResult<SubscriptionGroup[]> {
  const { authReady, isAuthed, me } = useAuth();
  return useQuery({
    queryKey: [...SUBSCRIPTION_GROUPS_KEY, me?.id],
    queryFn: ({ signal }) => fetchSubscriptionGroups(signal),
    enabled: authReady && isAuthed,
    staleTime: 60_000,
  });
}

type GroupActions = {
  busy: boolean;
  error: string | null;
  notice: string | null;
  clearError: () => void;
  run: (
    action: () => Promise<unknown>,
    success: string,
    change?: "groups" | "memberships",
  ) => Promise<boolean>;
};

export function useGroupActions(enabled: boolean): GroupActions {
  const client = useQueryClient();
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function run(
    action: () => Promise<unknown>,
    success: string,
    change: "groups" | "memberships" = "memberships",
  ): Promise<boolean> {
    if (!enabled || lock.current) return false;
    lock.current = true;
    setBusy(true);
    setError(null);
    setNotice(null);
    let succeeded = false;
    try {
      await action();
      succeeded = true;
      setNotice(success);
    } catch (cause) {
      setError(
        cause instanceof MembershipUpdateError
          ? cause.failedUrls.length === 1
            ? m.sg_partial_one_failure()
            : m.sg_partial_failure({ count: cause.failedUrls.length })
          : cause instanceof ApiError && cause.code === "subscription_group_name_conflict"
            ? m.sg_duplicate_name()
            : cause instanceof ApiError && cause.code === "subscription_group_invalid_name"
              ? m.sg_invalid_name()
              : m.sg_save_error(),
      );
    } finally {
      await invalidateSubscriptionQueries(client, change);
      lock.current = false;
      setBusy(false);
    }
    return succeeded;
  }

  return { busy, error, notice, clearError: () => setError(null), run };
}
