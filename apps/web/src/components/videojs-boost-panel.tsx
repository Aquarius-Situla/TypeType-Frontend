import { useMedia } from "@videojs/react";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";
import { currentBoost, setBoost } from "../lib/audio-boost";
import { m } from "../paraglide/messages.js";
import { PANEL_ROUND_BUTTON, PANEL_SLIDER } from "./videojs-speed-panel";

const MAX = 3;
const STEP = 0.25;
const PRESETS = [1, 1.5, 2, 3] as const;

export function useBoostTarget(): HTMLVideoElement | null {
  const target = (useMedia() as { target?: unknown } | null)?.target;
  return target instanceof HTMLVideoElement ? target : null;
}

const percent = (value: number) => `${Math.round(value * 100)} %`;

// The audio boost of the Vidstack settings: 0 to 300 % in steps of 25, for this video only, as Vidstack kept no
// storage here.
export function VideoJsBoostPanel({ video }: { video: HTMLVideoElement }) {
  const [value, setValue] = useState(() => currentBoost(video));
  const set = (next: number) => {
    const bounded = Math.min(MAX, Math.max(0, Math.round(next / STEP) * STEP));
    setBoost(video, bounded);
    setValue(bounded);
  };
  const label = m.player_boost();
  return (
    <div className="flex flex-col items-center gap-4 px-3 pt-2 pb-3">
      <p aria-live="polite" className="font-semibold text-lg tabular-nums">
        {percent(value)}
      </p>
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          aria-label={m.algo_decrease({ name: label })}
          className={PANEL_ROUND_BUTTON}
          onClick={() => set(value - STEP)}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <input
          type="range"
          min={0}
          max={MAX}
          step={STEP}
          value={value}
          aria-label={label}
          aria-valuetext={percent(value)}
          onChange={(event) => set(Number(event.currentTarget.value))}
          onKeyDown={(event) => {
            const delta = { ArrowRight: STEP, ArrowUp: STEP, ArrowLeft: -STEP, ArrowDown: -STEP }[
              event.key
            ];
            if (delta === undefined) return;
            event.preventDefault();
            event.stopPropagation();
            set(value + delta);
          }}
          style={{
            background: `linear-gradient(to right, #fff ${(value / MAX) * 100}%, rgb(255 255 255 / 0.3) ${(value / MAX) * 100}%)`,
          }}
          className={PANEL_SLIDER}
        />
        <button
          type="button"
          aria-label={m.algo_increase({ name: label })}
          className={PANEL_ROUND_BUTTON}
          onClick={() => set(value + STEP)}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="flex w-full justify-between gap-1.5">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            aria-pressed={value === preset}
            className={`flex-1 rounded-full py-1.5 text-xs tabular-nums outline-none transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-white ${
              value === preset
                ? "bg-white font-semibold text-black"
                : "bg-white/10 hover:bg-white/20"
            }`}
            onClick={() => set(preset)}
          >
            {percent(preset)}
          </button>
        ))}
      </div>
    </div>
  );
}
