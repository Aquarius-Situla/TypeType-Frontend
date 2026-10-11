import { InfoTip } from "./algorithm-info";
import { LEVEL_LABEL } from "./algorithm-labels";
import { useEntered } from "./animated-number";

export function Meter({ label, help, level }: { label: string; help: string; level: number }) {
  const entered = useEntered();
  return (
    <div className="flex min-w-0 flex-col gap-2">
      <span className="flex min-w-0 flex-wrap items-center gap-x-1 text-xs text-fg-soft">
        <span>{label}</span>
        <InfoTip label={label} text={help} />
      </span>
      <span className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-2.5">
        <span className="flex gap-1" aria-hidden="true">
          {[1, 2, 3].map((step) => (
            <span
              key={step}
              className={`h-1.5 w-5 rounded-full transition-colors duration-500 sm:w-6 ${
                entered && step <= level ? "bg-accent" : "bg-surface-strong"
              }`}
              style={{ transitionDelay: `${step * 90}ms` }}
            />
          ))}
        </span>
        <span className="text-sm text-fg">{LEVEL_LABEL[level]?.()}</span>
      </span>
    </div>
  );
}
