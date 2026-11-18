import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTwitchUserEmotes } from "../lib/api-twitch";
import type { ChatEmoteMap } from "../lib/twitch-chat-parts";
import { type EmoteGroup, emoteGroups } from "../lib/twitch-emote-picker";

export function useTwitchEmotePicker(login: string, thirdParty: ChatEmoteMap, open: boolean) {
  const account = useQuery({
    queryKey: ["twitch", "user-emotes", login],
    queryFn: () => fetchTwitchUserEmotes(login),
    enabled: open && login.length > 0,
    staleTime: 10 * 60_000,
    retry: false,
  });
  const groups: EmoteGroup[] = useMemo(
    () => emoteGroups(account.data, thirdParty.values()),
    [account.data, thirdParty],
  );
  return { groups, loading: account.isLoading };
}
