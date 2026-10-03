import { Inbox, Users } from "lucide-react";
import { useState } from "react";
import { useGroupPagination } from "../../hooks/use-group-pagination";
import { m } from "../../paraglide/messages.js";
import type { SubscriptionGroup } from "../../types/subscription-groups";
import { GroupNameForm } from "./group-name-form";
import { GroupPagination } from "./group-pagination";
import { GroupSidebarItem } from "./group-sidebar-item";

type Props = {
  groups: SubscriptionGroup[];
  total: number;
  ungrouped: number;
  filter: string;
  disabled: boolean;
  onFilter: (value: string) => void;
  onCreate: (name: string) => Promise<boolean>;
  onRename: (id: string, name: string) => Promise<boolean>;
  onCancelRename: () => void;
  onDelete: (group: SubscriptionGroup) => void;
};

export function GroupSidebar(props: Props): React.JSX.Element {
  const [query, setQuery] = useState("");
  const matches = props.groups.filter((group) =>
    group.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()),
  );
  const pagination = useGroupPagination({ total: matches.length, rowRem: 2.25, fallbackSize: 6 });
  return (
    <aside className="flex min-h-0 min-w-0 flex-col gap-2 border border-border bg-surface p-2">
      <h2 className="px-1 text-sm font-semibold">{m.sg_groups()}</h2>
      <GroupNameForm busy={props.disabled} onSave={props.onCreate} />
      <nav aria-label={m.sg_group_filters()} className="flex flex-col">
        {[
          { id: "all", name: m.sg_all_channels(), count: props.total, icon: Users },
          {
            id: "ungrouped",
            name: m.sg_ungrouped(),
            count: props.ungrouped,
            icon: Inbox,
          },
        ].map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={props.disabled}
            onClick={() => props.onFilter(item.id)}
            aria-current={props.filter === item.id ? "true" : undefined}
            className={`flex h-9 shrink-0 items-center gap-2 border px-2 text-left text-sm disabled:opacity-50 ${props.filter === item.id ? "border-fg bg-surface-strong text-fg" : "border-transparent text-fg-muted hover:bg-surface-strong hover:text-fg"}`}
          >
            <item.icon size={14} />
            <span className="flex-1">{item.name}</span>
            <span className="text-xs text-fg-muted tabular-nums">{item.count}</span>
          </button>
        ))}
      </nav>
      <input
        type="search"
        aria-label={m.sg_search_groups()}
        placeholder={m.sg_search_groups()}
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          pagination.onPage(0);
        }}
        className="h-8 w-full shrink-0 border border-border bg-app px-2 text-xs placeholder:text-fg-muted"
      />
      <div ref={pagination.viewport} className="min-h-0 flex-1">
        {matches.slice(pagination.start, pagination.end).map((group) => (
          <GroupSidebarItem
            key={group.id}
            group={group}
            active={props.filter === group.id}
            disabled={props.disabled}
            onSelect={() => props.onFilter(group.id)}
            onRename={(name) => props.onRename(group.id, name)}
            onCancelRename={props.onCancelRename}
            onDelete={() => props.onDelete(group)}
          />
        ))}
        {matches.length === 0 && (
          <p className="px-2 py-3 text-xs leading-relaxed text-fg-muted">
            {props.groups.length === 0 ? m.sg_no_groups() : m.sg_no_group_results()}
          </p>
        )}
      </div>
      <GroupPagination
        {...pagination}
        compact
        label={m.sg_groups()}
        total={matches.length}
        disabled={props.disabled}
      />
    </aside>
  );
}
