import { Minus, Plus } from "lucide-react";
import { m } from "../../paraglide/messages.js";
import { useAnimatedNumber } from "./animated-number";

const STEP_BUTTON =
  "flex h-full w-8 items-center justify-center text-fg-muted transition-colors hover:bg-surface-strong hover:text-fg disabled:cursor-not-allowed disabled:opacity-30";

export function Stepper({
  label,
  value,
  min,
  max,
  step,
  unit,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit?: string | null;
  format: (value: number) => string;
  onChange: (value: number) => void;
}) {
  const move = (direction: 1 | -1) =>
    onChange(Math.min(max, Math.max(min, Number((value + direction * step).toFixed(4)))));
  // The shown value glides through every whole unit between steps (30 %, 31 %, … 35 %),
  // never through fractions like 0,3333.
  const animated = useAnimatedNumber<HTMLOutputElement>(value);
  const grain = unit === "%" ? 0.01 : step >= 1 ? 1 : step;
  const shown = Math.round(animated.value / grain) * grain;
  return (
    <fieldset className="flex h-9 shrink-0 items-stretch overflow-hidden rounded-sm border border-border-strong bg-app">
      <legend className="sr-only">{label}</legend>
      <button
        type="button"
        onClick={() => move(-1)}
        disabled={value <= min}
        aria-label={m.algo_decrease({ name: label })}
        className={`${STEP_BUTTON} border-r border-border-strong`}
      >
        <Minus className="size-3.5" aria-hidden="true" />
      </button>
      <output
        ref={animated.ref}
        className="flex min-w-20 items-center justify-center px-2 text-sm tabular-nums text-fg"
      >
        <span aria-hidden="true">{format(Number(shown.toFixed(4)))}</span>
        <span className="sr-only">{format(value)}</span>
      </output>
      <button
        type="button"
        onClick={() => move(1)}
        disabled={value >= max}
        aria-label={m.algo_increase({ name: label })}
        className={`${STEP_BUTTON} border-l border-border-strong`}
      >
        <Plus className="size-3.5" aria-hidden="true" />
      </button>
    </fieldset>
  );
}
