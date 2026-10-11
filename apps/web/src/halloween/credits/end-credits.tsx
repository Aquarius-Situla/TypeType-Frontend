import { useEffect, useRef } from "react";
import { m } from "../../paraglide/messages.js";
import { useEndCredits } from "../end-credits-store";
import { useLightsOutStore } from "../lights-out-store";
import { SIGN_OFF } from "./credit-roles";
import { CreditRoll } from "./credit-roll";
import { creditsFrame } from "./credits-timing";

type Props = { onDone: () => void };

const LEAVE_MS = 700;

export function EndCredits({ onDone }: Props) {
  const startedAt = useEndCredits((state) => state.startedAt);
  const curtain = useRef<HTMLDivElement>(null);
  const roll = useRef<HTMLDivElement>(null);
  const signOff = useRef<HTMLDivElement>(null);
  const done = useRef(onDone);
  done.current = onDone;

  useEffect(() => () => useEndCredits.getState().reset(), []);

  useEffect(() => {
    if (startedAt === null) return;
    let frame = 0;
    const leave = (): void => {
      if (!curtain.current) return;
      curtain.current.style.transition = `opacity ${LEAVE_MS}ms`;
      curtain.current.style.opacity = "0";
    };
    const tick = (now: number): void => {
      if (useLightsOutStore.getState().phase === "restoring") {
        leave();
        return;
      }
      const state = creditsFrame(now - startedAt);
      if (curtain.current) curtain.current.style.opacity = String(state.curtain);
      if (roll.current) {
        const travel = innerHeight + roll.current.offsetHeight;
        roll.current.style.transform = `translateY(${innerHeight - state.roll * travel}px)`;
      }
      if (signOff.current) signOff.current.style.opacity = String(state.signOff);
      if (state.done) {
        done.current();
        leave();
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [startedAt]);

  if (startedAt === null) return null;
  return (
    <div
      ref={curtain}
      role="dialog"
      aria-label={m.halloween_credits_label()}
      className="pointer-events-none fixed inset-0 z-[80] overflow-hidden bg-black opacity-0"
    >
      <div ref={roll} className="absolute inset-x-0 top-0 will-change-transform">
        <CreditRoll />
      </div>
      <div ref={signOff} className="absolute inset-0 grid place-items-center opacity-0">
        <p className="font-serif text-5xl font-bold text-orange-400 sm:text-7xl">{SIGN_OFF}</p>
      </div>
    </div>
  );
}
