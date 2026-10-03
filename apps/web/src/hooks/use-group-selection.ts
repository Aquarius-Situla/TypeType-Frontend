import { type UseQueryResult, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { selectedMembershipOptions } from "../lib/group-membership-queries";
import type { GroupedSubscription } from "../types/subscription-groups";
import { useAuth } from "./use-auth";

type Selection = {
  channels: Map<string, GroupedSubscription>;
  drafts: ReadonlyMap<string, ReadonlySet<string>>;
};

export function useGroupSelection(): {
  chosen: GroupedSubscription[];
  selected: Set<string>;
  drafts: Selection["drafts"];
  query: UseQueryResult<GroupedSubscription[]>;
  select: (channels: GroupedSubscription[]) => void;
  clear: () => void;
  toggle: (channel: GroupedSubscription) => void;
  setDraft: (url: string, ids: Set<string>) => void;
} {
  const { me, authReady, isAuthed } = useAuth();
  const [state, setState] = useState<Selection>({ channels: new Map(), drafts: new Map() });
  const query = useQuery({
    ...selectedMembershipOptions(me?.id, [...state.channels.keys()]),
    enabled: authReady && isAuthed && state.channels.size > 0,
    initialData: () => [...state.channels.values()],
    initialDataUpdatedAt: 0,
  });
  const chosen = query.data ?? [...state.channels.values()];
  return {
    chosen,
    selected: new Set(chosen.map((channel) => channel.channelUrl)),
    drafts: state.drafts,
    query,
    select: (channels) =>
      setState((current) => ({
        ...current,
        channels: new Map([...chosen, ...channels].map((channel) => [channel.channelUrl, channel])),
      })),
    clear: () => setState({ channels: new Map(), drafts: new Map() }),
    toggle: (channel) =>
      setState((current) => {
        const channels = new Map(chosen.map((item) => [item.channelUrl, item]));
        if (channels.has(channel.channelUrl)) channels.delete(channel.channelUrl);
        else channels.set(channel.channelUrl, channel);
        return {
          channels,
          drafts: new Map([...current.drafts].filter(([url]) => channels.has(url))),
        };
      }),
    setDraft: (url, ids) =>
      setState((current) =>
        current.channels.has(url)
          ? { ...current, drafts: new Map(current.drafts).set(url, ids) }
          : current,
      ),
  };
}
