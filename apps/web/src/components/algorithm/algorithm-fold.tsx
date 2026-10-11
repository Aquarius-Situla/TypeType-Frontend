import { ChevronDown, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ROW } from "../../settings/settings-toggle-switch";
import { Collapse } from "./algorithm-collapse";

type Props = {
  icon: LucideIcon;
  label: string;
  description: string;
  summary: ReactNode;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
};

export function AlgorithmFold({
  icon: Icon,
  label,
  description,
  summary,
  open,
  onToggle,
  children,
}: Props) {
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={`${ROW} group w-full text-left`}
      >
        <span className="flex min-w-0 flex-auto items-start gap-3">
          <Icon
            className={`mt-0.5 size-4 shrink-0 transition-colors duration-300 ${open ? "text-accent" : "text-fg-muted"}`}
            aria-hidden="true"
          />
          <span className="typetype-adaptive-label flex min-w-0 flex-auto flex-col gap-1">
            <span className="text-sm text-fg">{label}</span>
            <span className="text-xs text-fg-soft">{description}</span>
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-3 text-xs text-fg-muted">
          {summary}
          <ChevronDown
            className={`size-4 text-fg-soft transition-transform duration-300 group-hover:text-fg ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </span>
      </button>
      <Collapse open={open}>
        <div className="mb-4 ml-2 divide-y divide-border border-l-2 border-border pl-5">
          {children}
        </div>
      </Collapse>
    </div>
  );
}
