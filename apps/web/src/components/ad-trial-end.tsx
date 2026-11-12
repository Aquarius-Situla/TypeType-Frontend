import { CornerUpLeft, Play, RotateCcw } from "lucide-react";
import { type ReactNode, useState } from "react";
import { useAdEntrance } from "../hooks/use-ad-entrance";
import { LEMMY_COMMUNITY_URL } from "../lib/lemmy";
import { m } from "../paraglide/messages.js";
import { AdCredits } from "./ad-credits";

type Props = {
  ending: number;
  title: string;
  // Every ending found so far, this one included.
  found: readonly number[];
  // This ending had never been reached before.
  fresh: boolean;
  onBack: () => void;
  onRestart: () => void;
  onFinish: () => void;
};

const SOFT =
  "rounded-full px-4 py-2 text-sm font-medium text-white ring-1 ring-white/40 transition hover:bg-white/15";
const SOLID =
  "rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-zinc-200";

function Tile({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-2xl bg-white/10 px-3 py-5 text-center text-sm font-semibold text-white ring-2 ring-white/25 transition hover:scale-[1.03] hover:bg-white/20 hover:ring-white focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-400 sm:py-8 sm:text-xl"
    >
      {icon}
      {label}
    </button>
  );
}

// What follows an ending of the trial: go back to the last choice, start over or stop. Stopping
// leads to the thanks screen, the only way an ad hands the viewer back to their video.
const ENDINGS = [1, 2, 3, 4, 5];

export function AdTrialEnd({ ending, title, found, fresh, onBack, onRestart, onFinish }: Props) {
  const [thanks, setThanks] = useState(false);
  // Finding the last ending earns the credits before the thanks.
  const complete = found.length >= ENDINGS.length;
  const [credits, setCredits] = useState(false);
  const shown = useAdEntrance();
  const screen = `absolute inset-0 z-20 flex items-center justify-center px-6 pb-10 text-center transition-opacity duration-700 ${shown ? "opacity-100" : "opacity-0"}`;
  if (credits) {
    return (
      <AdCredits
        onDone={() => {
          setCredits(false);
          setThanks(true);
        }}
      />
    );
  }
  if (thanks) {
    return (
      <div className={`${screen} bg-black`}>
        <div className="flex max-w-xl flex-col items-center gap-4">
          <p className="text-xl font-semibold sm:text-3xl">{m.ad_thanks_title()}</p>
          <p className="text-sm leading-6 text-white/80 sm:text-base">{m.ad_thanks_text()}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={LEMMY_COMMUNITY_URL} target="_blank" rel="noreferrer" className={SOFT}>
              {m.ad_thanks_message()}
            </a>
            <button type="button" onClick={onFinish} className={SOLID}>
              {m.ad_thanks_continue()}
            </button>
          </div>
          <p className="mt-2 text-xs uppercase tracking-widest text-white/50">
            {m.ad_thanks_credit()}
          </p>
        </div>
      </div>
    );
  }
  const icon = "h-7 w-7 sm:h-10 sm:w-10";
  return (
    <div className={`${screen} bg-black`}>
      <div className="flex w-full max-w-3xl flex-col items-center gap-5 sm:gap-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-yellow-300 sm:text-sm">
            {m.ad_ending({ n: String(ending) })}
          </p>
          <p className="mt-1 text-2xl font-bold sm:text-4xl">{title}</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            {ENDINGS.map((number) => (
              <span
                key={number}
                className={`h-2.5 w-2.5 rounded-full ${found.includes(number) ? "bg-yellow-300" : "bg-white/20"} ${number === ending ? "ring-2 ring-white ring-offset-2 ring-offset-black" : ""}`}
              />
            ))}
          </div>
          {fresh && (
            <p className="mt-3 text-xs font-semibold text-yellow-300 sm:text-sm">
              {m.ad_new_ending()}
            </p>
          )}
        </div>
        <div className="flex w-full gap-3 sm:gap-5">
          <Tile
            icon={<CornerUpLeft className={icon} aria-hidden="true" />}
            label={m.ad_back_choice()}
            onClick={onBack}
          />
          <Tile
            icon={<RotateCcw className={icon} aria-hidden="true" />}
            label={m.ad_restart()}
            onClick={onRestart}
          />
          <Tile
            icon={<Play className={icon} aria-hidden="true" />}
            label={m.ad_done()}
            onClick={() => (complete ? setCredits(true) : setThanks(true))}
          />
        </div>
      </div>
    </div>
  );
}
