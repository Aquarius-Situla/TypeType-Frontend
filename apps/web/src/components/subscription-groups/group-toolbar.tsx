import { ArrowLeftRight, Search, X } from "lucide-react";
import { useState } from "react";
import { m } from "../../paraglide/messages.js";
import type { SubscriptionGroup } from "../../types/subscription-groups";

type Props = {
  groups: SubscriptionGroup[];
  defaultTarget: string;
  isGroup: boolean;
  excluded: boolean;
  query: string;
  selectedCount: number;
  hiddenCount: number;
  resultCount: number;
  allSelected: boolean;
  onlySelected: boolean;
  disabled: boolean;
  busy: boolean;
  onQuery: (value: string) => void;
  onExcluded: (value: boolean) => void;
  onSelectResults: () => void;
  onClear: () => void;
  onOnlySelected: () => void;
  onBulk: (groupId: string, action: "add" | "remove") => void;
  onRemoveAll: () => void;
};

export function GroupToolbar(props: Props): React.JSX.Element {
  const [target, setTarget] = useState(props.defaultTarget);
  const validTarget = props.groups.some((group) => group.id === target) ? target : "";
  return (
    <div className="shrink-0 border border-border bg-surface">
      <fieldset
        disabled={props.busy}
        className="flex flex-wrap items-center gap-2 border-b border-border p-2"
      >
        <label className="flex h-8 min-w-40 flex-1 items-center gap-2 border border-border bg-app px-2">
          <Search size={14} className="text-fg-muted" />
          <input
            type="search"
            maxLength={200}
            value={props.query}
            onChange={(event) => props.onQuery(event.target.value)}
            disabled={props.onlySelected}
            aria-label={m.sg_search_channels()}
            placeholder={m.sg_search_channels()}
            className="min-w-0 flex-1 bg-transparent text-sm placeholder:text-fg-muted outline-none"
          />
        </label>
        <button
          type="button"
          disabled={props.disabled || props.resultCount === 0 || props.allSelected}
          onClick={props.onSelectResults}
          className="sg-button"
        >
          {m.sg_select_page({ count: props.resultCount })}
        </button>
        <button
          type="button"
          disabled={!props.isGroup || props.onlySelected}
          aria-pressed={props.isGroup && props.excluded}
          title={m.sg_membership_filter()}
          onClick={() => props.onExcluded(!props.excluded)}
          className="sg-button sg-membership-toggle"
        >
          <ArrowLeftRight size={14} aria-hidden="true" />
          {props.isGroup && props.excluded ? m.sg_not_in_group() : m.sg_in_group()}
        </button>
      </fieldset>
      <fieldset disabled={props.disabled} className="flex flex-wrap items-center gap-1.5 p-2">
        <div className="mr-auto text-xs" role="status" aria-live="polite">
          <p className="font-medium">
            {props.busy
              ? m.sg_saving()
              : props.selectedCount > 0
                ? m.sg_selected({ count: props.selectedCount })
                : m.sg_select_hint()}
          </p>
          {props.hiddenCount > 0 && (
            <p className="mt-1 text-fg-muted">
              {m.sg_hidden_selected({ count: props.hiddenCount })}
            </p>
          )}
        </div>
        {(props.selectedCount > 0 || props.onlySelected) && (
          <button
            type="button"
            aria-pressed={props.onlySelected}
            onClick={props.onOnlySelected}
            className="sg-button border-transparent underline underline-offset-4"
          >
            {props.onlySelected ? m.sg_back_to_results() : m.sg_show_selected()}
          </button>
        )}
        <select
          value={validTarget}
          onChange={(event) => setTarget(event.target.value)}
          disabled={props.selectedCount === 0}
          aria-label={m.sg_target_group()}
          className="sg-button w-36 min-w-0 bg-app"
        >
          <option value="">{m.sg_target_group()}</option>
          {props.groups.map((group) => (
            <option key={group.id} value={group.id}>
              {group.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!validTarget || props.selectedCount === 0}
          onClick={() => props.onBulk(validTarget, "add")}
          className="sg-button bg-fg text-app hover:bg-fg-strong"
        >
          {m.sg_add()}
        </button>
        <button
          type="button"
          disabled={!validTarget || props.selectedCount === 0}
          onClick={() => props.onBulk(validTarget, "remove")}
          className="sg-button"
        >
          {m.sg_remove()}
        </button>
        <button
          type="button"
          disabled={props.selectedCount === 0}
          onClick={props.onRemoveAll}
          className="sg-button hover:text-danger"
        >
          {m.sg_remove_all()}
        </button>
        <button
          type="button"
          disabled={props.selectedCount === 0}
          onClick={props.onClear}
          aria-label={m.sg_clear()}
          title={m.sg_clear()}
          className="sg-button border-transparent"
        >
          <X size={13} />
        </button>
      </fieldset>
    </div>
  );
}
