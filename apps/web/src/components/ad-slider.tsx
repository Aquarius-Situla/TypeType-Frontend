type Props = {
  label: string;
  value: number;
  max: number;
  step: number;
  // Read out by screen readers in place of the raw number.
  valueText: string;
  onChange: (value: number) => void;
  className?: string;
};

// A thin bar in the style of the player: a native range input, invisible, laid over the drawing so
// that dragging, clicking and the keyboard all keep working.
export function AdSlider({ label, value, max, step, valueText, onChange, className = "" }: Props) {
  const share = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className={`group/slider relative flex h-4 items-center ${className}`}>
      <div className="absolute inset-x-0 h-1 overflow-hidden rounded-full bg-white/25 transition-[height] group-hover/slider:h-1.5">
        <div className="h-full bg-yellow-400" style={{ width: `${share}%` }} />
      </div>
      <div
        className="pointer-events-none absolute h-3 w-3 -translate-x-1/2 scale-0 rounded-full bg-yellow-400 shadow transition-transform group-hover/slider:scale-100 group-focus-within/slider:scale-100"
        style={{ left: `${share}%` }}
      />
      <input
        type="range"
        min={0}
        max={max || 1}
        step={step}
        value={Math.min(value, max || 1)}
        aria-label={label}
        aria-valuetext={valueText}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );
}
