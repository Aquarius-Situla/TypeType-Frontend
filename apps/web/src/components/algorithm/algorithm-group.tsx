import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useHighlight } from "../../hooks/use-highlight";
import { GROUP } from "./algorithm-classes";
import { SectionLabel } from "./algorithm-section-label";

export function Group({
  label,
  children,
  highlightId,
  icon,
  help,
}: {
  label: string;
  children: ReactNode;
  highlightId?: string;
  icon?: LucideIcon;
  help?: string;
}) {
  const highlight = useHighlight<HTMLElement>(highlightId);
  return (
    <section ref={highlight.ref} className="flex scroll-mt-24 flex-col gap-3">
      <SectionLabel
        label={label}
        icon={icon}
        help={help}
        className={`min-h-7 ${highlight.className}`}
      />
      <div className={GROUP}>{children}</div>
    </section>
  );
}
