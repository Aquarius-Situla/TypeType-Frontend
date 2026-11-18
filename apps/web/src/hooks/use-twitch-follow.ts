import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchTwitchFollow, setTwitchFollow } from "../lib/api-twitch";
import type { TwitchFollowState } from "../types/twitch";
import { useTwitchAccount } from "./use-twitch";

export function useTwitchFollow(login: string) {
  const account = useTwitchAccount();
  const linked = account.data?.linked === true;
  const client = useQueryClient();
  const key = ["twitch", "follow", login];
  const state = useQuery({
    queryKey: key,
    queryFn: () => fetchTwitchFollow(login),
    enabled: linked && login.length > 0,
    staleTime: 60_000,
  });
  const mutation = useMutation({
    mutationFn: (follow: boolean) => setTwitchFollow(login, follow),
    onMutate: async (follow) => {
      await client.cancelQueries({ queryKey: key });
      const previous = client.getQueryData<TwitchFollowState>(key);
      if (previous) client.setQueryData(key, { ...previous, following: follow });
      return { previous };
    },
    onError: (_error, _follow, context) => {
      if (context?.previous) client.setQueryData(key, context.previous);
    },
    onSuccess: (next) => {
      client.setQueryData(key, next);
      void client.invalidateQueries({ queryKey: ["twitch", "followed-live"] });
    },
  });
  return {
    linked,
    loading: account.isLoading || (linked && state.isLoading),
    following: state.data?.following === true,
    followedAt: state.data?.followedAt,
    subscription: state.data?.subscription,
    pending: mutation.isPending,
    failed: mutation.isError,
    toggle: () => mutation.mutate(!(state.data?.following === true)),
  };
}
