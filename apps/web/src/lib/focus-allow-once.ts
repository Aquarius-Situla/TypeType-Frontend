import { ApiError } from "./api";
import type { FocusAllowOnceKind, FocusSettings } from "./api-focus";

export type FocusBlockCode =
  | "focus_channel_blocked"
  | "focus_study_pending"
  | "focus_study_active"
  | "focus_entertainment_blocked"
  | "focus_entertainment_rewatch_blocked";

export function shouldShowAllowOnceAction(
  videoUrl: string | undefined,
  effectiveCode: FocusBlockCode,
): boolean {
  return (
    Boolean(videoUrl) &&
    (effectiveCode === "focus_channel_blocked" ||
      effectiveCode === "focus_study_pending" ||
      effectiveCode === "focus_entertainment_rewatch_blocked")
  );
}

export function allowOnceKindForCode(code: FocusBlockCode): FocusAllowOnceKind {
  return code === "focus_entertainment_rewatch_blocked" ? "entertainment_rewatch" : "outside_group";
}

export function defaultDailyLimitForKind(kind: FocusAllowOnceKind): number {
  return kind === "entertainment_rewatch" ? 2 : 3;
}

export function remainingForAllowOnceKind(
  settings: FocusSettings | undefined,
  kind: FocusAllowOnceKind,
): number | undefined {
  if (!settings) return undefined;
  return kind === "entertainment_rewatch"
    ? settings.rewatchAllowOnceRemainingToday
    : settings.allowOnceRemainingToday;
}

export function isAllowOnceExhausted(remainingToday: number | undefined): boolean {
  return typeof remainingToday === "number" && remainingToday <= 0;
}

export function resolveAllowOnceErrorKind(
  error: unknown,
): "invalid_captcha" | "exhausted" | "generic" | null {
  if (!error) return null;
  if (error instanceof ApiError) {
    if (error.code === "focus_invalid_captcha") return "invalid_captcha";
    if (error.code === "focus_allow_once_exhausted") return "exhausted";
  }
  return "generic";
}

export function formatCountdown(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatCooldownMinutes(cooldownMs: number): number {
  if (cooldownMs <= 0) return 0;
  return Math.max(1, Math.ceil(cooldownMs / 60_000));
}
