import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchChannelNotificationPreferences,
  updateChannelNotificationPreference,
} from "../lib/api-notifications";
import { useAuth } from "./use-auth";

const CHANNEL_NOTIFICATION_PREFERENCES_KEY = ["channel-notification-preferences"] as const;

export function useChannelNotificationPreferences() {
  const queryClient = useQueryClient();
  const { authReady, isAuthed, isGuest, me } = useAuth();
  const enabled = authReady && isAuthed && !isGuest;
  const profileId = me?.id ?? null;
  const query = useQuery({
    queryKey: CHANNEL_NOTIFICATION_PREFERENCES_KEY,
    queryFn: fetchChannelNotificationPreferences,
    enabled,
    staleTime: 30_000,
    retry: false,
  });
  const update = useMutation({
    mutationFn: ({ channelUrl, enabled: next }: { channelUrl: string; enabled: boolean }) =>
      updateChannelNotificationPreference(channelUrl, next),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: CHANNEL_NOTIFICATION_PREFERENCES_KEY }),
        queryClient.invalidateQueries({ queryKey: ["notifications", profileId] }),
        queryClient.invalidateQueries({ queryKey: ["notifications-unread-count", profileId] }),
        queryClient.invalidateQueries({ queryKey: ["notification-toast-candidates", profileId] }),
      ]);
    },
  });

  return { query, update };
}
