import { SkipForward } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { AD_CHIP } from "../lib/ad-player";
import { type AdSkipSpot, exitSpot, fleeSpot, runSeconds } from "../lib/ad-skip-path";
import { m } from "../paraglide/messages.js";
import { AdSkipLimbs } from "./ad-skip-limbs";

const SKIP_AFTER_SECONDS = 5;
const LIMBS_AFTER_TRIES = 3;
const GONE_AFTER_TRIES = 7;
const HOP_SECONDS = 0.22;
// Before it bolts, the button leans back and spins its legs on the spot.
const WINDUP_SECONDS = 0.35;
const ESCAPE_SECONDS = 0.7;

type Move = "idle" | "hop" | "run" | "escape";
type Flight = { move: Move; seconds: number; delay: number; facing: "left" | "right" };
type Pointer = { clientX: number; clientY: number };
type Props = { elapsed: number };

const STILL: Flight = { move: "idle", seconds: 0, delay: 0, facing: "right" };

function within(box: DOMRect, x: number, y: number): AdSkipSpot {
  return { left: ((x - box.left) / box.width) * 100, top: ((y - box.top) / box.height) * 100 };
}

// The original act of the skip button: it hops away from the pointer, grows arms and legs after a
// few tries and runs from then on, then bolts off the frame for good.
export function AdSkipRunner({ elapsed }: Props) {
  const wrap = useRef<HTMLDivElement | null>(null);
  const timer = useRef(0);
  const [skippable, setSkippable] = useState(false);
  const [tries, setTries] = useState(0);
  const [spot, setSpot] = useState<AdSkipSpot | null>(null);
  const [flight, setFlight] = useState(STILL);
  const [dust, setDust] = useState<AdSkipSpot | null>(null);
  const [gone, setGone] = useState(false);
  const moving = flight.move !== "idle";

  useEffect(() => {
    if (elapsed >= SKIP_AFTER_SECONDS) setSkippable(true);
  }, [elapsed]);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  function flee(pointer?: Pointer) {
    const own = wrap.current?.getBoundingClientRect();
    const frame = wrap.current?.offsetParent?.getBoundingClientRect();
    if (!skippable || moving || tries >= GONE_AFTER_TRIES || !own || !frame) return;
    const from = within(frame, own.left, own.top);
    const chaser = pointer
      ? within(frame, pointer.clientX - own.width / 2, pointer.clientY - own.height / 2)
      : from;
    const next = tries + 1;
    const escaping = next >= GONE_AFTER_TRIES;
    const running = next >= LIMBS_AFTER_TRIES;
    const to = escaping ? exitSpot(from, chaser) : fleeSpot(from, chaser);
    const seconds = escaping ? ESCAPE_SECONDS : running ? runSeconds(from, to) : HOP_SECONDS;
    const delay = escaping ? WINDUP_SECONDS : 0;
    setTries(next);
    // Pin the button where it stands first, so that the move below is a transition from there.
    setSpot(from);
    setFlight({
      move: escaping ? "escape" : running ? "run" : "hop",
      seconds,
      delay,
      facing: to.left >= from.left ? "right" : "left",
    });
    if (escaping) setDust(from);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setSpot(to)));
    timer.current = window.setTimeout(
      () => (escaping ? setGone(true) : setFlight((before) => ({ ...before, move: "idle" }))),
      (seconds + delay) * 1000 + 60,
    );
  }

  if (gone) return null;

  const limbs = tries >= LIMBS_AFTER_TRIES;
  const ease = flight.move === "hop" ? "cubic-bezier(.3,1.5,.6,1)" : "linear";
  const glide = `${flight.seconds}s ${flight.move === "escape" ? "ease-in" : ease} ${flight.delay}s`;
  return (
    <>
      {dust && (
        <span
          aria-hidden="true"
          className="typetype-ad-dust pointer-events-none absolute z-40 p-5"
          style={{ left: `${dust.left}%`, top: `${dust.top}%` }}
        >
          <span />
          <span />
          <span />
        </span>
      )}
      <div
        ref={wrap}
        // The padding makes it flee before the pointer touches it. It starts above the control bar,
        // on the right as in the player, and runs over everything else in the frame.
        className={`absolute z-40 p-5 ${spot ? "" : "bottom-14 right-0"}`}
        style={
          spot
            ? {
                left: `${spot.left}%`,
                top: `${spot.top}%`,
                transition: `left ${glide}, top ${glide}`,
              }
            : undefined
        }
        onPointerEnter={flee}
        onPointerMove={flee}
        onPointerDown={flee}
      >
        <div
          className="typetype-ad-skip relative"
          data-move={flight.move}
          data-face={flight.facing}
          data-limbs={limbs || undefined}
        >
          {limbs && <AdSkipLimbs />}
          <button
            type="button"
            disabled={!skippable}
            onFocus={() => flee()}
            onClick={flee}
            className={`relative flex h-9 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium disabled:text-white/70 ${AD_CHIP}`}
          >
            {skippable
              ? m.ad_skip()
              : m.ad_skip_in({ n: String(Math.ceil(SKIP_AFTER_SECONDS - elapsed)) })}
            {skippable && <SkipForward className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>
    </>
  );
}
