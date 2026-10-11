import { lampLevel, lampRadius } from "./flashlight";
import { BANK_COUNT, bankAlpha, bankGradientStops } from "./light-banks";
import { useLightsOutStore } from "./lights-out-store";

const FEATHER = 0.035;
const RESTORE_MS = 700;

type Point = {
  x: number;
  y: number;
};

function bankAlphas(now: number): number[] {
  const { bankOffAt, flicker } = useLightsOutStore.getState();
  return Array.from({ length: BANK_COUNT }, (_, bank) => {
    const offAt = bankOffAt[bank];
    if (offAt !== null && offAt !== undefined) return bankAlpha(now - offAt);
    if (flicker && flicker.bank === bank) {
      const t = (now - flicker.startedAt) / flicker.durationMs;
      if (t >= 0 && t <= 1) return 0.55 * Math.sin(Math.PI * t);
    }
    return 0;
  });
}

function restoreFactor(now: number): number {
  const { phase, restoreStartedAt } = useLightsOutStore.getState();
  if (phase !== "restoring") return 1;
  return Math.max(0, 1 - (now - restoreStartedAt) / RESTORE_MS);
}

export function paintDarkness(ctx: CanvasRenderingContext2D, lamp: Point, now: number): void {
  const { width, height } = ctx.canvas;
  const factor = restoreFactor(now);
  ctx.globalCompositeOperation = "source-over";
  ctx.clearRect(0, 0, width, height);
  const gradient = ctx.createLinearGradient(0, 0, width, 0);
  for (const stop of bankGradientStops(bankAlphas(now), FEATHER)) {
    gradient.addColorStop(stop.offset, `rgba(0, 0, 0, ${stop.alpha * factor})`);
  }
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  const { lampOn, lampChangedAt } = useLightsOutStore.getState();
  const level = lampLevel(lampOn, lampChangedAt, now) * factor;
  if (useLightsOutStore.getState().visitedCorridor) {
    ctx.clearRect(0, 0, width, height);
    return;
  }
  if (level <= 0) return;
  const radius = lampRadius(width, height);
  const beam = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, radius);
  beam.addColorStop(0, `rgba(0, 0, 0, ${level})`);
  beam.addColorStop(0.35, `rgba(0, 0, 0, ${0.94 * level})`);
  beam.addColorStop(0.7, `rgba(0, 0, 0, ${0.5 * level})`);
  beam.addColorStop(1, "rgba(0, 0, 0, 0)");
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = beam;
  ctx.fillRect(lamp.x - radius, lamp.y - radius, radius * 2, radius * 2);

  const warmth = ctx.createRadialGradient(lamp.x, lamp.y, 0, lamp.x, lamp.y, radius * 0.9);
  warmth.addColorStop(0, `rgba(255, 196, 140, ${0.09 * level})`);
  warmth.addColorStop(1, "rgba(255, 196, 140, 0)");
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = warmth;
  ctx.fillRect(lamp.x - radius, lamp.y - radius, radius * 2, radius * 2);
}

export function isFullyRestored(now: number): boolean {
  return restoreFactor(now) <= 0;
}
