import { useEffect, useMemo, useRef, useState } from "react";
import { useAdEntrance } from "../hooks/use-ad-entrance";
import { trialThumbnailUrl } from "../lib/ad-media";
import type { AdAnswer, AdAsk } from "../lib/ad-trial";

// How many times a shy answer dodges the pointer before it gives in.
const SHY_TRIES = 3;
// Label size for each loudness level of an answer.
const LOUD_SIZES = [
  "text-base sm:text-2xl",
  "text-base sm:text-2xl",
  "text-lg sm:text-3xl",
  "text-lg sm:text-3xl",
  "text-xl sm:text-4xl",
  "text-xl sm:text-4xl",
];

type Props = { ask: AdAsk; seen: ReadonlySet<string>; onPick: (to: string) => void };

function answerClass(answer: AdAnswer): string {
  const loud = answer.loud ?? 0;
  const ring = loud >= 3 ? "ring-red-500 hover:ring-red-400" : "ring-white/25 hover:ring-white";
  return `group relative block aspect-video w-full overflow-hidden rounded-2xl bg-black text-left shadow-2xl ring-2 transition-[left,top,box-shadow,transform] duration-200 hover:z-10 hover:scale-[1.02] focus-visible:outline focus-visible:outline-4 focus-visible:outline-yellow-400 ${ring}`;
}

function labelClass(answer: AdAnswer): string {
  const loud = answer.loud ?? 0;
  const tone = loud >= 3 ? "from-red-700/95 via-red-700/70" : "from-black/90 via-black/60";
  return `absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent px-3 pb-3 pt-10 text-center font-bold leading-tight text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] sm:pb-4 ${tone} ${LOUD_SIZES[loud] ?? "text-2xl"}`;
}

// A choice of the trial: the question over two or three cards, side by side over the waiting clip.
// Answers can also be picked with the number keys.
export function AdChoices({ ask, seen, onPick }: Props) {
  const answers = useMemo(
    () => ask.answers.filter((answer) => !answer.needs || seen.has(answer.needs)),
    [ask, seen],
  );
  const [shy, setShy] = useState({ tries: 0, left: 0, top: 0 });
  const picked = useRef(false);
  const firstButton = useRef<HTMLButtonElement | null>(null);

  function labelOf(answer: AdAnswer): string {
    return answer.shy && shy.tries >= SHY_TRIES ? answer.shy() : answer.label();
  }

  function flee(answer: AdAnswer): boolean {
    if (!answer.shy || shy.tries >= SHY_TRIES) return false;
    // It dodges outwards, away from the other cards and clear of the question above, then comes
    // back to its place when it gives in.
    const outwards = answers.indexOf(answer) < answers.length / 2 ? -1 : 1;
    setShy((current) => {
      const tries = current.tries + 1;
      if (tries >= SHY_TRIES) return { tries, left: 0, top: 0 };
      return {
        tries,
        left: outwards * Math.round(40 + Math.random() * 70),
        top: current.tries % 2 === 0 ? 34 : 10,
      };
    });
    return true;
  }

  function choose(answer: AdAnswer) {
    if (picked.current || flee(answer)) return;
    picked.current = true;
    onPick(answer.to);
  }

  const chooseRef = useRef(choose);
  chooseRef.current = choose;

  useEffect(() => {
    firstButton.current?.focus({ preventScroll: true });
    function onKeyDown(event: KeyboardEvent) {
      const answer = answers[Number(event.key) - 1];
      if (!/^[1-9]$/.test(event.key) || !answer) return;
      event.preventDefault();
      event.stopPropagation();
      chooseRef.current(answer);
    }
    window.addEventListener("keydown", onKeyDown, { capture: true });
    return () => window.removeEventListener("keydown", onKeyDown, { capture: true });
  }, [answers]);

  const shown = useAdEntrance();
  const enter = `transition-[opacity,transform] duration-500 ease-out ${shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"}`;

  return (
    <div
      className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/55 px-4 pb-14 transition-opacity sm:pb-32 duration-500 sm:gap-6 ${shown ? "opacity-100" : "opacity-0"}`}
    >
      <p
        className={`max-w-[90%] text-center text-lg font-bold drop-shadow-[0_2px_6px_rgba(0,0,0,1)] sm:text-3xl ${enter}`}
      >
        {ask.question()}
      </p>
      <div
        className="grid w-full gap-3 sm:gap-5"
        style={{
          gridTemplateColumns: `repeat(${answers.length}, minmax(0, 1fr))`,
          maxWidth: answers.length > 2 ? "84%" : "62%",
        }}
      >
        {answers.map((answer, index) => (
          <div
            key={answer.to}
            className={enter}
            style={{ transitionDelay: `${80 + index * 90}ms` }}
          >
            <button
              ref={index === 0 ? firstButton : undefined}
              type="button"
              className={answerClass(answer)}
              style={answer.shy ? { left: shy.left, top: shy.top } : undefined}
              onPointerEnter={() => flee(answer)}
              onClick={() => choose(answer)}
            >
              <img
                src={trialThumbnailUrl(answer.to)}
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100"
              />
              <span className="absolute left-3 top-3 rounded-md bg-black/75 px-2.5 py-0.5 text-sm font-semibold tabular-nums sm:text-lg">
                {index + 1}
              </span>
              <span className={labelClass(answer)}>{labelOf(answer)}</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
