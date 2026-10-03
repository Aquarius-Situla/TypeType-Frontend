import { useMemo } from "react";
import { useGroupManager } from "../../hooks/use-group-manager";
import { useInterfaceLocale } from "../../hooks/use-interface-locale";
import { useSubscriptionGroups } from "../../hooks/use-subscription-groups";
import {
  createSubscriptionGroup,
  renameSubscriptionGroup,
  updateGroupMemberships,
} from "../../lib/api-subscription-groups";
import { channelMembershipChanges } from "../../lib/subscription-group-selection";
import { m } from "../../paraglide/messages.js";
import { GroupChannelList } from "./group-channel-list";
import { GroupConfirmDialog } from "./group-confirm-dialog";
import { GroupManagerData } from "./group-manager-data";
import { GroupManagerHeader } from "./group-manager-header";
import { GroupSidebar } from "./group-sidebar";
import { GroupToolbar } from "./group-toolbar";
import "../../styles/subscription-groups.css";

export function GroupManager(): React.JSX.Element {
  useInterfaceLocale();
  const groupsQuery = useSubscriptionGroups();
  const groups = useMemo(
    () => [...(groupsQuery.data ?? [])].sort((a, b) => a.name.localeCompare(b.name)),
    [groupsQuery.data],
  );
  const {
    actions,
    page,
    selectionQuery,
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
    selectResults,
    setOnlySelected,
    setDraft,
    setConfirmation,
    changeFilter,
    toggle,
    clearSelection,
    bulk,
    confirm,
  } = useGroupManager(groups, groupsQuery.isSuccess);
  const channelsQuery = onlySelected ? selectionQuery : page.query;
  const total = page.query.data?.totalSubscriptions ?? 0;
  return (
    <div className="sg-manager mx-auto flex w-full max-w-[1440px] flex-col gap-3 pt-3">
      <GroupManagerHeader />
      <GroupManagerData groups={groupsQuery} channels={channelsQuery} selection={selectionQuery}>
        <GroupSidebar
          groups={groups}
          total={total}
          ungrouped={page.query.data?.ungroupedCount ?? 0}
          filter={activeFilter}
          disabled={disabled}
          onFilter={changeFilter}
          onCreate={(name) =>
            actions.run(
              () => createSubscriptionGroup(name),
              m.sg_group_created({ group: name }),
              "groups",
            )
          }
          onRename={(id, name) =>
            actions.run(() => renameSubscriptionGroup(id, name), m.sg_group_renamed(), "groups")
          }
          onDelete={setConfirmation}
          onCancelRename={actions.clearError}
        />
        <div className="flex min-h-0 min-w-0 flex-col gap-2" aria-busy={actions.busy}>
          <GroupToolbar
            key={activeFilter}
            groups={groups}
            defaultTarget={activeGroup?.id ?? ""}
            isGroup={Boolean(activeGroup)}
            excluded={excluded}
            query={query}
            selectedCount={chosen.length}
            hiddenCount={hiddenCount}
            resultCount={visible.length}
            allSelected={
              visible.length > 0 &&
              visible.every((channel) => validSelected.has(channel.channelUrl))
            }
            onlySelected={onlySelected}
            disabled={disabled}
            busy={actions.busy}
            onQuery={setQuery}
            onExcluded={setExcluded}
            onSelectResults={selectResults}
            onClear={clearSelection}
            onOnlySelected={() => setOnlySelected(!onlySelected)}
            onBulk={bulk}
            onRemoveAll={() => setConfirmation("clear")}
          />
          {actions.error && (
            <p
              role="alert"
              className="break-words border border-danger/40 bg-surface px-3 py-2 text-sm text-danger"
            >
              {actions.error}
            </p>
          )}
          {actions.notice && (
            <p
              role="status"
              className="break-words border border-border bg-surface px-3 py-2 text-sm"
            >
              {actions.notice}
            </p>
          )}
          {total === 0 && page.query.isSuccess ? (
            <div className="border border-border bg-surface p-10 text-center">
              <p className="text-sm">{m.ui_no_subscriptions_yet_2()}</p>
              <p className="mt-2 text-xs text-fg-muted">{m.sg_empty_subscriptions()}</p>
            </div>
          ) : (
            <GroupChannelList
              label={
                onlySelected
                  ? m.sg_show_selected()
                  : activeGroup && excluded
                    ? m.sg_outside_named({ group: filterName })
                    : filterName
              }
              channels={visible}
              pagination={page.pagination}
              groups={groups}
              selected={validSelected}
              editing={editing}
              drafts={drafts}
              busy={actions.busy}
              disabled={disabled}
              onToggle={toggle}
              onDraft={setDraft}
              onCancel={clearSelection}
              onSave={(channel, ids) =>
                actions.run(
                  () => updateGroupMemberships(channelMembershipChanges(channel, ids)),
                  m.sg_channel_saved({ channel: channel.name }),
                )
              }
            />
          )}
        </div>
      </GroupManagerData>
      {confirmationProps && !disabled && (
        <GroupConfirmDialog
          {...confirmationProps}
          onCancel={() => setConfirmation(null)}
          onConfirm={confirm}
        />
      )}
    </div>
  );
}
