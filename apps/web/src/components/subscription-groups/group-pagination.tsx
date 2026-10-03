import { ChevronLeft, ChevronRight } from "lucide-react";
import type { GroupPage } from "../../lib/group-pagination";
import { m } from "../../paraglide/messages.js";

type Props = GroupPage & {
  total: number;
  label: string;
  compact?: boolean;
  disabled: boolean;
  onPage: (page: number) => void;
};

export function GroupPagination(props: Props): React.JSX.Element {
  return (
    <nav
      aria-label={props.label}
      className="flex min-h-10 shrink-0 items-center justify-between gap-2 border-t border-border px-2 py-1 text-xs text-fg-muted"
    >
      <p className="min-w-0 truncate tabular-nums" role="status" title={props.label}>
        {!props.compact && <span className="font-medium text-fg">{props.label} · </span>}
        {m.sg_page_range({
          start: props.total ? props.start + 1 : 0,
          end: props.end,
          total: props.total,
        })}
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          disabled={props.disabled || props.page === 0}
          onClick={() => props.onPage(props.page - 1)}
          aria-label={m.sg_previous_page()}
          title={m.sg_previous_page()}
          className="sg-button size-8 px-0"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>
        {!props.compact && (
          <span className="min-w-12 text-center tabular-nums">
            {props.page + 1} / {props.pages}
          </span>
        )}
        <button
          type="button"
          disabled={props.disabled || props.page === props.pages - 1}
          onClick={() => props.onPage(props.page + 1)}
          aria-label={m.sg_next_page()}
          title={m.sg_next_page()}
          className="sg-button size-8 px-0"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
