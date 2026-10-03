import { ChevronDown, Plus, X } from "lucide-react";
import { useGroupCombobox } from "../../hooks/use-group-combobox";
import { m } from "../../paraglide/messages.js";
import type { SubscriptionGroup } from "../../types/subscription-groups";

type Props = {
  groups: SubscriptionGroup[];
  selected: ReadonlySet<string>;
  disabled: boolean;
  onToggle: (id: string) => void;
};

export function GroupCombobox({ groups, selected, disabled, onToggle }: Props): React.JSX.Element {
  const combo = useGroupCombobox(groups, selected, onToggle);
  const expanded = combo.open && !disabled;
  return (
    <fieldset
      ref={combo.root}
      aria-label={m.sg_memberships()}
      className="relative min-w-0 flex-1"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) combo.setOpen(false);
      }}
    >
      <div className="sg-combobox flex min-h-8 items-start border border-border bg-app p-1">
        <div className="flex max-h-24 min-w-0 flex-1 flex-wrap items-center gap-1 overflow-y-auto">
          {combo.chosen.map((group) => (
            <button
              type="button"
              key={group.id}
              onClick={() => {
                onToggle(group.id);
                combo.input.current?.focus();
              }}
              aria-label={m.sg_remove_named({ group: group.name })}
              title={group.name}
              className="sg-chip inline-flex max-w-full items-center gap-2 py-1 text-fg hover:border-fg-muted"
            >
              <span className="truncate">{group.name}</span>
              <X size={12} className="shrink-0" />
            </button>
          ))}
          <input
            ref={combo.input}
            role="combobox"
            aria-label={m.sg_search_groups()}
            aria-expanded={expanded}
            aria-controls={expanded ? combo.listId : undefined}
            aria-autocomplete="list"
            aria-activedescendant={
              expanded && combo.active >= 0 ? `${combo.listId}-${combo.active}` : undefined
            }
            autoComplete="off"
            placeholder={m.sg_add_groups()}
            value={combo.query}
            onChange={(event) => combo.search(event.target.value)}
            onClick={() => combo.setOpen(true)}
            onKeyDown={combo.onKeyDown}
            className="h-6 w-20 min-w-16 flex-1 bg-transparent px-1 text-xs text-fg placeholder:text-fg-muted outline-none"
          />
        </div>
        <button
          type="button"
          tabIndex={-1}
          aria-label={m.sg_search_groups()}
          aria-expanded={expanded}
          onPointerDown={(event) => event.preventDefault()}
          onClick={() => {
            combo.setOpen(!expanded);
            combo.input.current?.focus();
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center text-fg-muted hover:text-fg"
        >
          <ChevronDown size={14} className={expanded ? "rotate-180" : undefined} />
        </button>
      </div>
      {expanded && (
        <div
          ref={combo.list}
          id={combo.listId}
          role="listbox"
          aria-label={m.sg_groups()}
          style={{ maxHeight: combo.placement.height }}
          className={`absolute inset-x-0 z-30 overflow-y-auto overscroll-contain border border-border-strong bg-surface ${combo.placement.above ? "bottom-full mb-1" : "top-full mt-1"}`}
        >
          {combo.matches.map((group, index) => (
            <button
              key={group.id}
              id={`${combo.listId}-${index}`}
              type="button"
              role="option"
              aria-selected={false}
              tabIndex={-1}
              title={group.name}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => combo.choose(group.id)}
              className={`flex min-h-9 w-full items-center justify-between gap-3 px-3 py-2 text-left text-xs text-fg ${index === combo.active ? "bg-surface-strong" : "hover:bg-surface-strong"}`}
            >
              <span className="truncate">{group.name}</span>
              <Plus size={13} className="shrink-0 text-fg-muted" />
            </button>
          ))}
          {combo.matches.length === 0 && (
            <p role="status" className="px-3 py-3 text-xs text-fg-muted">
              {m.sg_no_group_match()}
            </p>
          )}
        </div>
      )}
    </fieldset>
  );
}
