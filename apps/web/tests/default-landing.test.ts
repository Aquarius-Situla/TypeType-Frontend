import { beforeEach, expect, test } from "bun:test";
import {
  DEFAULT_LANDING_STORAGE_KEY,
  HIDE_HOME_STORAGE_KEY,
  defaultLandingPath,
  readStoredDefaultLandingPath,
  shouldHideHomeNavigation,
  syncStoredLandingSettings,
} from "../src/lib/default-landing";

const store: Record<string, string> = {};

beforeEach(() => {
  for (const k of Object.keys(store)) {
    delete store[k];
  }
  const existing = globalThis.window ?? {};
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      ...existing,
      location: existing.location ?? { origin: "http://localhost" },
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
      },
    },
  });
});

test("maps landing page values to corresponding routes", () => {
  expect(defaultLandingPath("subscriptions")).toBe("/subscriptions");
  expect(defaultLandingPath("history")).toBe("/history");
  expect(defaultLandingPath("playlists")).toBe("/playlists");
  expect(defaultLandingPath("watch-later")).toBe("/watch-later");
  expect(defaultLandingPath("favorites")).toBe("/favorites");
  expect(defaultLandingPath("home")).toBeNull();
  expect(defaultLandingPath("unknown")).toBeNull();
});

test("determines when home navigation should be hidden", () => {
  // If home recommendations are hidden AND landing page is not home, hide home button
  expect(shouldHideHomeNavigation("subscriptions", true)).toBe(true);
  expect(shouldHideHomeNavigation("history", true)).toBe(true);

  // If home is the landing page, never hide home button even if recommendations are hidden
  expect(shouldHideHomeNavigation("home", true)).toBe(false);

  // If recommendations are NOT hidden, do not hide home button
  expect(shouldHideHomeNavigation("subscriptions", false)).toBe(false);
  expect(shouldHideHomeNavigation("home", false)).toBe(false);
});

test("reads stored default landing path from localStorage", () => {
  expect(readStoredDefaultLandingPath()).toBeNull();

  store[DEFAULT_LANDING_STORAGE_KEY] = "subscriptions";
  expect(readStoredDefaultLandingPath()).toBe("/subscriptions");

  store[DEFAULT_LANDING_STORAGE_KEY] = "home";
  expect(readStoredDefaultLandingPath()).toBeNull();
});

test("syncs landing settings to localStorage", () => {
  syncStoredLandingSettings("subscriptions", true);
  expect(store[DEFAULT_LANDING_STORAGE_KEY]).toBe("subscriptions");
  expect(store[HIDE_HOME_STORAGE_KEY]).toBe("true");

  syncStoredLandingSettings("home", false);
  expect(store[DEFAULT_LANDING_STORAGE_KEY]).toBe("home");
  expect(store[HIDE_HOME_STORAGE_KEY]).toBe("false");
});
