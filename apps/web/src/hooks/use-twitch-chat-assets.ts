import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchTwitchChannelChatAssets, fetchTwitchGlobalChatAssets } from "../lib/api-twitch";
import type { ChatEmoteMap } from "../lib/twitch-chat-parts";
import type { TwitchChatBadge, TwitchThirdPartyEmote } from "../types/twitch";
import { useTwitchEnabled } from "./use-twitch";

export type ChatAssets = {
  emotes: ChatEmoteMap;
  badge: (id: string) => TwitchChatBadge | undefined;
};

export function useTwitchChatAssets(login: string): ChatAssets {
  const enabled = useTwitchEnabled();
  const global = useQuery({
    queryKey: ["twitch", "chat-assets"],
    queryFn: fetchTwitchGlobalChatAssets,
    enabled,
    staleTime: 60 * 60_000,
    gcTime: 2 * 60 * 60_000,
  });
  const channel = useQuery({
    queryKey: ["twitch", "chat-assets", login],
    queryFn: () => fetchTwitchChannelChatAssets(login),
    enabled: enabled && login.length > 0,
    staleTime: 10 * 60_000,
  });
  return useMemo(() => {
    const emotes = new Map<string, TwitchThirdPartyEmote>();
    for (const list of [channel.data?.emotes, global.data?.emotes]) {
      for (const emote of list ?? []) if (!emotes.has(emote.name)) emotes.set(emote.name, emote);
    }
    const channelBadges = channel.data?.badges ?? {};
    const globalBadges = global.data?.badges ?? {};
    return { emotes, badge: (id: string) => channelBadges[id] ?? globalBadges[id] };
  }, [channel.data, global.data]);
}
