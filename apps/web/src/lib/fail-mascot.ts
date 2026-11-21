import type { ResolvedTheme } from "../stores/theme-store";

const FAIL_MASCOT_GIFS: Record<ResolvedTheme, string> = {
  dark: "/fail/fail-dark.gif",
  light: "/fail/fail-light.gif",
};

export const FAIL_MASCOT_DIMENSIONS = { width: 600, height: 448 } as const;

export function failMascotSrc(theme: ResolvedTheme): string {
  return FAIL_MASCOT_GIFS[theme];
}

export function allFailMascotPaths(): readonly string[] {
  return [FAIL_MASCOT_GIFS.dark, FAIL_MASCOT_GIFS.light];
}
