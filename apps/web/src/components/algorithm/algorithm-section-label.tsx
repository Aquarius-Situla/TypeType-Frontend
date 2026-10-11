import type { LucideIcon } from "lucide-react";
import { InfoTip } from "./algorithm-info";

const SECTION_LABEL = "px-1 text-xs font-medium text-fg-soft uppercase tracking-wider";

export function SectionLabel({
  label,
  icon: Icon,
  help,
  className = "",
}: {
  label: string;
  icon?: LucideIcon;
  help?: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2 ${SECTION_LABEL} ${className}`}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <p>{label}</p>
      {help && <InfoTip label={label} text={help} />}
    </div>
  );
}
