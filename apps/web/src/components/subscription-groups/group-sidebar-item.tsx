import { MoreHorizontal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useGroupActionMenu } from "../../hooks/use-group-action-menu";
import { m } from "../../paraglide/messages.js";
import type { SubscriptionGroup } from "../../types/subscription-groups";
import { GroupNameForm } from "./group-name-form";

type Props = {
  group: SubscriptionGroup;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
  onRename: (name: string) => Promise<boolean>;
  onCancelRename: () => void;
  onDelete: () => void;
};

export function GroupSidebarItem({
  group,
  active,
  disabled,
  onSelect,
  onRename,
  onCancelRename,
  onDelete,
}: Props): React.JSX.Element {
  const [renaming, setRenaming] = useState(false);
  const menu = useGroupActionMenu(disabled);
  const actionButton = menu.trigger;
  const wasRenaming = useRef(false);
  useEffect(() => {
    if (wasRenaming.current && !renaming) actionButton.current?.focus();
    wasRenaming.current = renaming;
  }, [renaming, actionButton]);
  if (renaming)
    return (
      <GroupNameForm
        initialName={group.name}
        busy={disabled}
        onCancel={() => {
          setRenaming(false);
          onCancelRename();
        }}
        onSave={async (name) => {
          const saved = await onRename(name);
          if (saved) setRenaming(false);
          return saved;
        }}
      />
    );
  return (
    <div
      className={`relative flex h-9 items-center border ${active ? "border-fg bg-surface-strong text-fg" : "border-transparent text-fg-muted"}`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        aria-current={active ? "true" : undefined}
        className="flex h-full min-w-0 flex-1 items-center justify-between gap-2 px-2 text-left text-sm hover:bg-surface-strong hover:text-fg disabled:opacity-50"
      >
        <span className="truncate" title={group.name}>
          {group.name}
        </span>
        <span className="text-xs text-fg-muted tabular-nums">{group.channelCount}</span>
      </button>
      <button
        ref={actionButton}
        type="button"
        disabled={disabled}
        onClick={menu.toggle}
        onKeyDown={menu.onTriggerKeyDown}
        aria-haspopup="menu"
        aria-controls={menu.open ? menu.id : undefined}
        aria-expanded={menu.open}
        aria-label={m.sg_group_actions({ group: group.name })}
        className="sg-button mr-1 w-7 border-0 px-0"
      >
        <MoreHorizontal size={16} />
      </button>
      {menu.open && (
        <div
          ref={menu.menu}
          id={menu.id}
          role="menu"
          tabIndex={-1}
          aria-label={m.sg_group_actions({ group: group.name })}
          className="absolute bottom-full right-0 z-30 mb-1 flex min-w-40 flex-col border border-border-strong bg-surface p-1"
          onKeyDown={menu.onMenuKeyDown}
        >
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={disabled}
            className="sg-menu-item"
            onClick={() => {
              menu.close();
              setRenaming(true);
            }}
          >
            {m.sg_rename_group()}
          </button>
          <button
            type="button"
            role="menuitem"
            tabIndex={-1}
            disabled={disabled}
            className="sg-menu-item text-danger"
            onClick={() => {
              menu.close(true);
              onDelete();
            }}
          >
            {m.sg_delete_group()}
          </button>
        </div>
      )}
    </div>
  );
}
