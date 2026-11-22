const FAIL_MASCOT_SRC = "/reactions/video-error.webp";

export const FAIL_MASCOT_DIMENSIONS = { width: 600, height: 448 } as const;

export function failMascotSrc(): string {
  return FAIL_MASCOT_SRC;
}

export function allFailMascotPaths(): readonly string[] {
  return [FAIL_MASCOT_SRC];
}
