import { useQuery } from "@tanstack/react-query";
import { fetchTwitchChatHighlights } from "../lib/api-twitch";
import { useTwitchEnabled } from "./use-twitch";

const REFRESH_MS = 10_000;

// Twitch only pushes polls and pins to its own PubSub; reading them every few seconds keeps the votes moving without
// another long-lived connection per viewer. React Query stops the refresh while the tab is hidden.
export function useTwitchChatHighlights(login: string) {
  return useQuery({
    queryKey: ["twitch", "chat-highlights", login],
    queryFn: () => fetchTwitchChatHighlights(login),
    enabled: useTwitchEnabled() && login.length > 0,
    refetchInterval: REFRESH_MS,
    staleTime: REFRESH_MS / 2,
    retry: false,
  });
}
