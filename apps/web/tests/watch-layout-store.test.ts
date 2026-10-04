import { beforeEach, expect, test } from "bun:test";
import { useWatchLayoutStore } from "../src/stores/watch-layout-store";

beforeEach(() => {
  useWatchLayoutStore.setState({ cinemaMode: false, webFullscreen: false });
});

test("toggles webFullscreen and resets cinemaMode when webFullscreen is activated", () => {
  const store = useWatchLayoutStore.getState();
  expect(store.webFullscreen).toBe(false);
  expect(store.cinemaMode).toBe(false);

  // Turn on cinema mode first
  store.setCinemaMode(true);
  expect(useWatchLayoutStore.getState().cinemaMode).toBe(true);

  // Activating webFullscreen should disable cinemaMode
  store.toggleWebFullscreen();
  expect(useWatchLayoutStore.getState().webFullscreen).toBe(true);
  expect(useWatchLayoutStore.getState().cinemaMode).toBe(false);

  // Toggling webFullscreen off should turn it false
  store.toggleWebFullscreen();
  expect(useWatchLayoutStore.getState().webFullscreen).toBe(false);
});

test("toggles cinemaMode and resets webFullscreen when cinemaMode is activated", () => {
  const store = useWatchLayoutStore.getState();
  store.setWebFullscreen(true);
  expect(useWatchLayoutStore.getState().webFullscreen).toBe(true);

  // Activating cinemaMode should disable webFullscreen
  store.toggleCinemaMode();
  expect(useWatchLayoutStore.getState().cinemaMode).toBe(true);
  expect(useWatchLayoutStore.getState().webFullscreen).toBe(false);
});
