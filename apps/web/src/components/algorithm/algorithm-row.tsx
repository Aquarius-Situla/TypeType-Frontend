import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useHighlight } from "../../hooks/use-highlight";
import { ROW } from "../../settings/settings-toggle-switch";
import { InfoTip } from "./algorithm-info";

export function Row({
  label,
  description,
  children,
  highlightId,
  icon: Icon,
  help,
}: {
  label: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  highlightId?: string;
  icon?: LucideIcon;
  help?: string;
}) {
  const highlight = useHighlight<HTMLDivElement>(highlightId);
  return (
    <div ref={highlight.ref} className={`${ROW} ${highlight.className}`}>
      <div className="flex min-w-0 flex-auto items-start gap-3">
        {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-fg-muted" aria-hidden="true" />}
        {/* flex-auto, not flex-1: the row wraps its control below only if the label keeps its width. */}
        <div className="typetype-adaptive-label flex min-w-0 flex-auto flex-col gap-1">
          <span className="text-sm text-fg">
            {label}
            {help && typeof label === "string" && (
              <span className="ml-1 inline-flex align-[-5px]">
                <InfoTip label={label} text={help} />
              </span>
            )}
          </span>
          {description && <span className="text-xs text-fg-soft">{description}</span>}
        </div>
      </div>
      {children}
    </div>
  );
}
