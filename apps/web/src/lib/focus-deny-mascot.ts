const FOCUS_DENY_MASCOT_SRC = "/focus/focus-deny.webp";

export const FOCUS_DENY_DIMENSIONS = { width: 1024, height: 1024 } as const;

export function focusDenyMascotSrc(): string {
  return FOCUS_DENY_MASCOT_SRC;
}

export function allFocusDenyMascotPaths(): readonly string[] {
  return [FOCUS_DENY_MASCOT_SRC];
}
