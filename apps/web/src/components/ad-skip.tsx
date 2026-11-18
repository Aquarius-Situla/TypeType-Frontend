import { useEffect, useRef, useState } from "react";
import { AD_CHIP } from "../lib/ad-player";
import { pickSkipVariant, SKIP_ACTS, type SkipActName } from "../lib/ad-skip-acts";
import { createSkipStage } from "../lib/ad-skip-stage";
import { m } from "../paraglide/messages.js";
import { AdSkipRunner } from "./ad-skip-runner";

const SKIP_AFTER_SECONDS = 5;

type Props = { elapsed: number };

function wantsLessMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// The skip button never skips. Each ad draws one of its acts; viewers who asked for less motion
// keep the runner, whose animations switch off.
export function AdSkip({ elapsed }: Props) {
  const [variant] = useState(() => (wantsLessMotion() ? "runner" : pickSkipVariant()));
  return variant === "runner" ? (
    <AdSkipRunner elapsed={elapsed} />
  ) : (
    <AdSkipAct name={variant} elapsed={elapsed} />
  );
}

function AdSkipAct({ name, elapsed }: { name: SkipActName; elapsed: number }) {
  const frame = useRef<HTMLDivElement | null>(null);
  const button = useRef<HTMLButtonElement | null>(null);
  const [skippable, setSkippable] = useState(false);
  const left = Math.ceil(SKIP_AFTER_SECONDS - elapsed);

  useEffect(() => {
    if (elapsed >= SKIP_AFTER_SECONDS) setSkippable(true);
  }, [elapsed]);

  // The act owns the button from the moment it can be "skipped": React only writes the countdown.
  useEffect(() => {
    if (!skippable || !frame.current || !button.current) return;
    const stage = createSkipStage(frame.current, button.current, m.ad_skip(), (seconds) =>
      m.ad_skip_in({ n: String(seconds) }),
    );
    SKIP_ACTS[name](stage);
    return stage.dispose;
  }, [skippable, name]);

  return (
    <div
      ref={frame}
      className="typetype-ad-act-stage pointer-events-none absolute inset-0 z-40 overflow-hidden"
    >
      <button
        ref={button}
        type="button"
        disabled={!skippable}
        className={`typetype-ad-act pointer-events-auto absolute flex h-9 items-center gap-2 whitespace-nowrap px-3 text-sm font-medium disabled:text-white/70 ${AD_CHIP} ${skippable ? "" : "bottom-16 right-3"}`}
      >
        {skippable ? null : m.ad_skip_in({ n: String(left) })}
      </button>
    </div>
  );
}
