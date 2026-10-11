import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function Entry({
  icon: Icon,
  term,
  children,
}: {
  icon: LucideIcon;
  term: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3 py-3">
      <Icon className="mt-1 size-4 shrink-0 text-fg-muted" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <dt className="text-xs text-fg-soft">{term}</dt>
        <dd className="text-sm leading-6 text-fg-muted">{children}</dd>
      </div>
    </div>
  );
}
