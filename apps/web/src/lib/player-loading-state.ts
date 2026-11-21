export function isPlayerStartingLoading(input: {
  started: boolean;
  paused: boolean;
  autoplaying: boolean;
  autoplay: boolean;
}): boolean {
  // SABR starts playback itself while the shell still reads as paused before the first frame.
  return !input.started && (input.autoplay || input.autoplaying || !input.paused);
}
