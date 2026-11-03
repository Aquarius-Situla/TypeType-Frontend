import { beforeEach, expect, test } from "bun:test";
import { SabrPlaybackRatePreference } from "../src/lib/sabr-playback-rate-preference";
import { usePlaybackRateStore } from "../src/stores/playback-rate-store";

function video(rate: number): HTMLVideoElement {
  return {
    defaultPlaybackRate: rate,
    playbackRate: rate,
    closest: () => null,
  } as unknown as HTMLVideoElement;
}

beforeEach(() => {
  usePlaybackRateStore.setState({ chosenRate: null, defaultRate: null });
});

test("a speed chosen on one video starts the next one", () => {
  const store = usePlaybackRateStore.getState();
  store.syncDefault(1);
  new SabrPlaybackRatePreference(1, store.choose).capture(video(1.5), false);

  const next = new SabrPlaybackRatePreference(
    usePlaybackRateStore.getState().chosenRate ?? 1,
    store.choose,
  );
  const element = video(1);
  next.apply(element, false);

  expect(element.playbackRate).toBe(1.5);
  expect(usePlaybackRateStore.getState().syncDefault(1)).toBe(false);
});

test("changing the default speed in settings drops the chosen speed", () => {
  const store = usePlaybackRateStore.getState();
  store.syncDefault(1);
  store.choose(1.5);

  expect(store.syncDefault(1.25)).toBe(true);
  expect(usePlaybackRateStore.getState().chosenRate).toBeNull();
});
