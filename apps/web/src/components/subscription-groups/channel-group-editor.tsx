import { m } from "../../paraglide/messages.js";
import type { GroupedSubscription, SubscriptionGroup } from "../../types/subscription-groups";
import { GroupCombobox } from "./group-combobox";

type Props = {
  channel: GroupedSubscription;
  groups: SubscriptionGroup[];
  desired: ReadonlySet<string>;
  onChange: (ids: Set<string>) => void;
  busy: boolean;
  disabled: boolean;
  onSave: (ids: Set<string>) => void;
  onCancel: () => void;
};

export function ChannelGroupEditor({
  channel,
  groups,
  desired,
  onChange,
  busy,
  disabled,
  onSave,
  onCancel,
}: Props): React.JSX.Element {
  const valid = new Set([...desired].filter((id) => groups.some((group) => group.id === id)));
  const changed =
    valid.size !== channel.groupIds.length || channel.groupIds.some((id) => !valid.has(id));
  function toggle(id: string): void {
    const next = new Set(desired);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  }
  return (
    <form
      className="pointer-events-auto min-w-0 basis-full sm:flex-[2]"
      aria-label={m.sg_edit_named({ channel: channel.name })}
      onSubmit={(event) => {
        event.preventDefault();
        if (changed && !disabled) onSave(valid);
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !disabled) {
          event.preventDefault();
          onCancel();
        }
      }}
    >
      <fieldset disabled={disabled} className="flex min-w-0 items-start gap-2">
        <GroupCombobox groups={groups} selected={valid} disabled={disabled} onToggle={toggle} />
        <button type="button" onClick={onCancel} className="sg-button shrink-0">
          {m.portability_cancel()}
        </button>
        <button
          type="submit"
          disabled={!changed}
          className="sg-button shrink-0 bg-fg text-app hover:bg-fg-strong"
        >
          {busy ? m.sg_saving() : m.ui_save()}
        </button>
      </fieldset>
    </form>
  );
}
