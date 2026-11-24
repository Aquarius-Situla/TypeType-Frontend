import { ApiError } from "./api";

export type FocusBlockCode =
  | "focus_channel_blocked"
  | "focus_study_pending"
  | "focus_study_active"
  | "focus_entertainment_blocked";

export function shouldShowAllowOnceAction(
  videoUrl: string | undefined,
  effectiveCode: FocusBlockCode,
): boolean {
  return (
    Boolean(videoUrl) &&
    (effectiveCode === "focus_channel_blocked" || effectiveCode === "focus_study_pending")
  );
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
