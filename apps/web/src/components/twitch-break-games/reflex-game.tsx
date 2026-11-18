import { useEffect, useRef, useState } from "react";
import { m } from "../../paraglide/messages.js";
import type { BreakGameProps } from "./pieces";

type Phase = "idle" | "armed" | "go" | "early" | "done";

function phaseText(phase: Phase, last: number): string {
  switch (phase) {
    case "armed":
      return m.twitch_game_reflex_wait();
    case "go":
      return m.twitch_game_reflex_go();
    case "early":
      return m.twitch_game_reflex_early();
    case "done":
      return m.twitch_game_reflex_result({ ms: String(last) });
    default:
      return m.twitch_game_reflex_start();
  }
}

export function ReflexGame(_: BreakGameProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [last, setLast] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const press = () => {
    if (phase === "armed") {
      clearTimeout(timer.current);
      setPhase("early");
    } else if (phase === "go") {
      const ms = Math.round(performance.now() - goAt.current);
      setLast(ms);
      setBest((current) => (current === null ? ms : Math.min(current, ms)));
      setPhase("done");
    } else {
      setPhase("armed");
      timer.current = setTimeout(
        () => {
          goAt.current = performance.now();
          setPhase("go");
        },
        1_500 + Math.random() * 2_500,
      );
    }
  };

  const colour =
    phase === "go"
      ? "bg-emerald-500"
      : phase === "armed"
        ? "bg-red-600"
        : "bg-white/10 hover:bg-white/15";
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-2">
      <button
        type="button"
        onPointerDown={press}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            press();
          }
        }}
        className={`h-36 w-full cursor-pointer rounded-xl px-4 font-semibold text-lg transition-colors ${colour}`}
      >
        {phaseText(phase, last)}
      </button>
      {best !== null && (
        <p className="text-sm text-white/70">{m.twitch_game_reflex_best({ ms: String(best) })}</p>
      )}
    </div>
  );
}
