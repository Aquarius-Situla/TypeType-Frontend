import { useState } from "react";
import { deleteSubscriptionGroup, updateGroupMemberships } from "../lib/api-subscription-groups";
import { clearMembershipChanges } from "../lib/subscription-group-selection";
import { m } from "../paraglide/messages.js";
import type { GroupedSubscription, SubscriptionGroup } from "../types/subscription-groups";
import { useGroupChannelPage } from "./use-group-channel-page";
import { useGroupSelection } from "./use-group-selection";
import { useGroupActions } from "./use-subscription-groups";

type State = {
  actions: ReturnType<typeof useGroupActions>;
  page: ReturnType<typeof useGroupChannelPage>;
  selectionQuery: ReturnType<typeof useGroupSelection>["query"];
  activeFilter: string;
  activeGroup: SubscriptionGroup | undefined;
  excluded: boolean;
  query: string;
  chosen: GroupedSubscription[];
  validSelected: Set<string>;
  visible: GroupedSubscription[];
  hiddenCount: number;
  filterName: string;
  disabled: boolean;
  editing: string | null;
  drafts: ReadonlyMap<string, ReadonlySet<string>>;
  onlySelected: boolean;
  confirmationProps: { title: string; description: string; confirmLabel: string } | null;
  setExcluded: (value: boolean) => void;
  setQuery: (value: string) => void;
  selectResults: () => void;
  setOnlySelected: (value: boolean) => void;
  setDraft: (url: string, ids: Set<string>) => void;
  setConfirmation: (value: SubscriptionGroup | "clear" | null) => void;
  changeFilter: (value: string) => void;
  toggle: (url: string) => void;
  clearSelection: () => void;
  bulk: (groupId: string, action: "add" | "remove") => Promise<void>;
  confirm: () => Promise<void>;
};

export function useGroupManager(groups: SubscriptionGroup[], groupsReady: boolean): State {
  const [filter, setFilter] = useState("all");
  const [excluded, setExcluded] = useState(false);
  const [query, setQuery] = useState("");
  const selection = useGroupSelection();
  const [onlySelected, setOnlySelected] = useState(false);
  const [confirmation, setConfirmation] = useState<SubscriptionGroup | "clear" | null>(null);
  const { chosen, selected: validSelected, drafts, setDraft } = selection;
  const activeGroup = groups.find((group) => group.id === filter);
  const activeFilter = activeGroup || filter === "ungrouped" ? filter : "all";
  const page = useGroupChannelPage(activeFilter, excluded, query, onlySelected ? chosen : null);
  const selectedChannels = new Map(chosen.map((channel) => [channel.channelUrl, channel]));
  const visible = page.channels.map(
    (channel) => selectedChannels.get(channel.channelUrl) ?? channel,
  );
  const canEdit =
    groupsReady &&
    selection.query.isSuccess &&
    !selection.query.isFetching &&
    (onlySelected || (page.query.isSuccess && !page.query.isPlaceholderData));
  const actions = useGroupActions(canEdit);
  const hiddenCount =
    chosen.length - visible.filter((channel) => validSelected.has(channel.channelUrl)).length;
  const filterName =
    activeGroup?.name ?? (activeFilter === "ungrouped" ? m.sg_ungrouped() : m.sg_all_channels());
  const editing = chosen.length === 1 ? chosen[0].channelUrl : null;
  const disabled = actions.busy || !canEdit;

  function toggle(url: string): void {
    actions.clearError();
    const channel = visible.find((item) => item.channelUrl === url);
    if (channel) selection.toggle(channel);
  }
  function changeFilter(value: string): void {
    actions.clearError();
    setFilter(value);
    setExcluded(false);
    setOnlySelected(false);
  }
  function clearSelection(): void {
    actions.clearError();
    selection.clear();
    setOnlySelected(false);
  }
  async function bulk(groupId: string, action: "add" | "remove"): Promise<void> {
    const channelUrls = chosen
      .filter((channel) => channel.groupIds.includes(groupId) === (action === "remove"))
      .map((channel) => channel.channelUrl);
    if (channelUrls.length === 0) return;
    const name = groups.find((group) => group.id === groupId)?.name ?? "";
    const message =
      action === "add"
        ? channelUrls.length === 1
          ? m.sg_added_one({ group: name })
          : m.sg_added({ count: channelUrls.length, group: name })
        : channelUrls.length === 1
          ? m.sg_removed_one({ group: name })
          : m.sg_removed({ count: channelUrls.length, group: name });
    if (
      await actions.run(() => updateGroupMemberships([{ groupId, channelUrls, action }]), message)
    )
      clearSelection();
  }
  async function confirm(): Promise<void> {
    const pending = confirmation;
    setConfirmation(null);
    if (pending === "clear") {
      const changes = clearMembershipChanges(chosen);
      if (changes.length === 0) return;
      if (await actions.run(() => updateGroupMemberships(changes), m.sg_memberships_cleared()))
        clearSelection();
    } else if (pending) {
      if (activeFilter === pending.id) changeFilter("all");
      await actions.run(
        () => deleteSubscriptionGroup(pending.id),
        m.sg_group_deleted({ group: pending.name }),
      );
    }
  }

  const confirmationProps = confirmation
    ? {
        title:
          confirmation === "clear"
            ? m.sg_remove_all()
            : m.sg_delete_named({ group: confirmation.name }),
        description:
          confirmation === "clear"
            ? chosen.length === 1
              ? m.sg_clear_one_confirmation()
              : m.sg_clear_confirmation({ count: chosen.length })
            : confirmation.channelCount === 1
              ? m.sg_delete_one_confirmation()
              : m.sg_delete_confirmation({ count: confirmation.channelCount }),
        confirmLabel: confirmation === "clear" ? m.sg_remove_all() : m.sg_delete_group(),
      }
    : null;
  return {
    actions,
    page,
    selectionQuery: selection.query,
    activeFilter,
    activeGroup,
    excluded,
    query,
    chosen,
    validSelected,
    visible,
    hiddenCount,
    filterName,
    disabled,
    editing,
    drafts,
    onlySelected,
    confirmationProps,
    setExcluded,
    setQuery,
    selectResults: () => selection.select(visible),
    setOnlySelected,
    setDraft,
    setConfirmation,
    changeFilter,
    toggle,
    clearSelection,
    bulk,
    confirm,
  };
}
