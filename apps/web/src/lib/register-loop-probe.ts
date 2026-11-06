const LOOP_BURST = 25;
const LOOP_WINDOW_MS = 1_000;

/**
 * Temporary probe: reports which player props change on every registration when the watch page
 * registers its player in a tight loop, before React gives up with "Maximum update depth".
 */
export function createRegisterLoopProbe() {
  let since = 0;
  let count = 0;
  let previous: Record<string, unknown> | null = null;
  return (streamId: string, enabled: boolean, props: Record<string, unknown>) => {
    const now = performance.now();
    if (now - since > LOOP_WINDOW_MS) {
      since = now;
      count = 0;
    }
    count += 1;
    if (count === LOOP_BURST && previous) {
      const before = previous;
      const changed = Object.keys(props).filter((key) => before[key] !== props[key]);
      const data = changed.filter((key) => typeof props[key] !== "function");
      const callbacks = changed.filter((key) => typeof props[key] === "function");
      console.error("[typetype] watch player register loop", {
        streamId,
        enabled,
        data,
        callbacks,
      });
      for (const key of data) console.error(`[typetype] ${key} changed`, before[key], props[key]);
    }
    previous = props;
  };
}
