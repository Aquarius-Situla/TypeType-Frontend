import { MEME } from "../corridor/stick-show";

export const CREDITS = {
  afterFinaleMs: MEME.rickroll.start + MEME.rickroll.length + 600,
  curtainMs: 1500,
  rollMs: 47000,
  signOffAt: 49500,
  signOffFadeMs: 1600,
  endMs: 60300,
  outMs: 1400,
} as const;

export type CreditsFrame = { curtain: number; roll: number; signOff: number; done: boolean };

const clamp = (t: number): number => Math.max(0, Math.min(1, t));
const ease = (t: number): number => 0.5 - 0.5 * Math.cos(Math.PI * t);

export function creditsDue(finaleSince: number | null): boolean {
  return finaleSince !== null && finaleSince >= CREDITS.afterFinaleMs;
}

export function creditsFrame(since: number): CreditsFrame {
  const fadeOut = clamp((CREDITS.endMs - since) / CREDITS.outMs);
  return {
    curtain: ease(clamp(since / CREDITS.curtainMs)),
    roll: clamp((since - CREDITS.curtainMs) / CREDITS.rollMs),
    signOff: ease(clamp((since - CREDITS.signOffAt) / CREDITS.signOffFadeMs)) * fadeOut,
    done: since >= CREDITS.endMs,
  };
}
