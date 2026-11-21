export type PlayerLoadingPhase = "starting" | "stalled" | null;

export function isPlayerStartingLoading(input: {
  started: boolean;
  paused: boolean;
  autoplaying: boolean;
  autoplay: boolean;
}): boolean {
  // SABR starts playback itself while the shell still reads as paused before the first frame.
  return !input.started && (input.autoplay || input.autoplaying || !input.paused);
}

export function resolvePlayerLoadingInput(input: {
  started: boolean;
  paused: boolean;
  waiting: boolean;
  autoplaying: boolean;
  autoplay: boolean;
  seeking?: boolean;
}): { starting: boolean; stalled: boolean } {
  const starting = isPlayerStartingLoading(input);
  const stalled = input.started && ((input.waiting && !input.paused) || Boolean(input.seeking));
  return { starting, stalled };
}
