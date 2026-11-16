import { selectPlaybackRate, usePlayer } from "@videojs/react";
import { Minus, Plus } from "lucide-react";
import { m } from "../paraglide/messages.js";

const MIN = 0.25;
const MAX = 4;
const STEP = 0.05;
const PRESETS = [1, 1.25, 1.5, 2, 3] as const;
const KEY_STEPS: Record<string, number> = {
  ArrowRight: STEP,
  ArrowUp: STEP,
  ArrowLeft: -STEP,
  ArrowDown: -STEP,
  Home: -MAX,
  End: MAX,
};
const ROUND =
  "flex size-8 shrink-0 items-center justify-center rounded-full bg-white/10 outline-none transition-colors duration-150 hover:bg-white/20 focus-visible:ring-2 focus-visible:ring-white";

const SLIDER =
  "h-1 flex-1 cursor-pointer appearance-none rounded-full outline-none focus-visible:ring-2 focus-visible:ring-white/70 [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white";

const bounded = (value: number) => Math.round(Math.min(MAX, Math.max(MIN, value)) * 100) / 100;

// The speed panel of the YouTube player: the speed in large, a fine slider with steps on each side, and the usual
// speeds one click away. The slider moves with the arrow keys itself, since the menu keeps them for its rows.
export function VideoJsSpeedPanel() {
  const rate = usePlayer(selectPlaybackRate);
  if (!rate) return null;
  const value = rate.playbackRate;
  const set = (next: number) => rate.setPlaybackRate(bounded(next));
  const label = m.player_speed();
  const fill = ((value - MIN) / (MAX - MIN)) * 100;
  return (
    <div className="flex flex-col items-center gap-4 px-3 pt-2 pb-3">
      <p aria-live="polite" className="font-semibold text-lg tabular-nums">
        {value.toFixed(2)}x
      </p>
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          aria-label={m.algo_decrease({ name: label })}
          className={ROUND}
          onClick={() => set(value - STEP)}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <input
          type="range"
          min={MIN}
          max={MAX}
          step={STEP}
          value={value}
          aria-label={label}
          aria-valuetext={`${value.toFixed(2)}x`}
          onChange={(event) => set(Number(event.currentTarget.value))}
          onKeyDown={(event) => {
            const delta = KEY_STEPS[event.key];
            if (delta === undefined) return;
            event.preventDefault();
            event.stopPropagation();
            set(value + delta);
          }}
          style={{
            background: `linear-gradient(to right, #fff ${fill}%, rgb(255 255 255 / 0.3) ${fill}%)`,
          }}
          className={SLIDER}
        />
        <button
          type="button"
          aria-label={m.algo_increase({ name: label })}
          className={ROUND}
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
            {preset === 1 ? "1.0" : preset}
          </button>
        ))}
      </div>
    </div>
  );
}
