import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchNotifications,
  fetchUnreadNotificationsCount,
  markAllNotificationsRead,
} from "../lib/api-notifications";
import { useAuth } from "./use-auth";

const PAGE_SIZE = 20;

const notificationsKey = (profileId: string | null) => ["notifications", profileId] as const;
export const notificationsUnreadKey = (profileId: string | null) =>
  ["notifications-unread-count", profileId] as const;

export function useNotifications(open: boolean) {
  const qc = useQueryClient();
  const { authReady, isAuthed, isGuest, me } = useAuth();
  const enabled = authReady && isAuthed && !isGuest;
  const profileId = me?.id ?? null;
  const unreadKey = notificationsUnreadKey(profileId);
  const key = notificationsKey(profileId);

  const unreadQuery = useQuery({
    queryKey: unreadKey,
    queryFn: () => fetchUnreadNotificationsCount(),
    enabled: enabled && profileId !== null,
    // Not asked again on a timer: the toast host reads the notifications every minute and
    // writes the count it gets with them here.
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const query = useInfiniteQuery({
    queryKey: key,
    queryFn: ({ pageParam = 0 }) => fetchNotifications(pageParam, PAGE_SIZE),
    getNextPageParam: (lastPage) => {
      if (lastPage.nextpage == null) return undefined;
      const nextPage = Number(lastPage.nextpage);
      return Number.isInteger(nextPage) && nextPage >= 0 ? nextPage : undefined;
    },
    initialPageParam: 0,
    enabled: enabled && open,
    staleTime: 30_000,
    retry: false,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(),
    onSuccess: (result) => {
      if (!result.available) return;
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: unreadKey });
    },
  });

  return {
    query,
    unreadQuery,
    markAllRead,
    unreadCount: unreadQuery.data?.unreadCount ?? null,
    badgeUnavailable: unreadQuery.isError || unreadQuery.data?.available === false,
    items: query.data?.pages.flatMap((page) => page.items) ?? [],
    hasNextPage: query.hasNextPage,
    fetchNextPage: query.fetchNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
    isFetchNextPageError: query.isFetchNextPageError,
    enabled,
  };
}
