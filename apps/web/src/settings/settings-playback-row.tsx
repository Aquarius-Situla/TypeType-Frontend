import { useEffect, useRef, useState } from "react";
import { ToggleSwitch } from "../components/toggle-switch";
import { ROW } from "./settings-toggle-switch";

type ToggleRowProps = {
  title: string;
  description: string;
  checked: boolean;
  onClick: () => void;
};

type NumberRowProps = {
  title: string;
  description: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
};

export const PLAYBACK_ROW = ROW;

export function PlaybackToggleRow({ title, description, checked, onClick }: ToggleRowProps) {
  return (
    <div className={PLAYBACK_ROW}>
      <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm text-fg">{title}</span>
        <span className="text-xs text-fg-soft">{description}</span>
      </div>
      <ToggleSwitch checked={checked} ariaLabel={title} onClick={onClick} />
    </div>
  );
}

export function PlaybackNumberRow({
  title,
  description,
  value,
  min,
  max,
  onChange,
}: NumberRowProps) {
  return (
    <div className={PLAYBACK_ROW}>
      <div className="typetype-adaptive-label flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-sm text-fg">{title}</span>
        <span className="text-xs text-fg-soft">{description}</span>
      </div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-20 flex-shrink-0 rounded-sm border border-border-strong bg-app px-3 py-1.5 text-right text-fg text-xs outline-none focus:ring-1 focus:ring-border-strong"
      />
    </div>
  );
}

type RangeRowProps = {
  title: string;
  value: number;
  min: number;
  max: number;
  unit?: string;
  onCommit: (value: number) => void;
};

export function PlaybackRangeRow({ title, value, min, max, unit = "", onCommit }: RangeRowProps) {
  const [draft, setDraft] = useState(value);
  const commitRef = useRef<number | null>(null);
  useEffect(() => setDraft(value), [value]);
  useEffect(
    () => () => {
      if (commitRef.current !== null) window.clearTimeout(commitRef.current);
    },
    [],
  );
  const change = (next: number) => {
    setDraft(next);
    if (commitRef.current !== null) window.clearTimeout(commitRef.current);
    commitRef.current = window.setTimeout(() => onCommit(next), 300);
  };
  return (
    <div className={PLAYBACK_ROW}>
      <label className="typetype-adaptive-label flex min-w-0 flex-1 items-center gap-3">
        <span className="w-24 shrink-0 text-sm text-fg">{title}</span>
        <input
          type="range"
          min={min}
          max={max}
          value={draft}
          onChange={(event) => change(Number(event.target.value))}
          className="min-w-0 flex-1 accent-accent"
        />
        <span className="w-12 text-right text-xs text-fg-soft tabular-nums">
          {draft}
          {unit}
        </span>
      </label>
    </div>
  );
}
