import { ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { m } from "../../paraglide/messages.js";
import { InfoTip } from "./algorithm-info";

type Props = {
  label: string;
  icon: LucideIcon;
  help: string;
  description?: ReactNode;
  onAdjust?: () => void;
  children: ReactNode;
};

export function AlgorithmPanel({
  label,
  icon: Icon,
  help,
  description,
  onAdjust,
  children,
}: Props) {
  return (
    <section className="flex min-w-0 flex-col gap-3">
      <div className="flex items-end justify-between gap-4 px-1">
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wider text-fg-soft uppercase">
            <Icon className="size-3.5 shrink-0" aria-hidden="true" />
            <p>{label}</p>
            <InfoTip label={label} text={help} />
          </div>
          {description && <p className="text-xs text-fg-muted">{description}</p>}
        </div>
        {onAdjust && (
          <button
            type="button"
            onClick={onAdjust}
            className="group flex shrink-0 items-center gap-0.5 text-xs text-fg-muted transition-colors hover:text-fg"
          >
            {m.algo_adjust()}
            <ChevronRight
              className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
      <div className="border-y border-border">{children}</div>
    </section>
  );
}
