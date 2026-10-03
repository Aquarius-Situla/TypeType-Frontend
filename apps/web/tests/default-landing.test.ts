import { beforeEach, expect, test } from "bun:test";
import {
  clearStoredLandingSettings,
  defaultLandingPath,
  readStoredDefaultLandingPath,
  readStoredLandingSettings,
  shouldHideHomeNavigation,
  syncStoredLandingSettings,
} from "../src/lib/default-landing";
import { clearUserCaches, readSettingsCache, writeSettingsCache } from "../src/lib/settings-cache";
import type { SettingsItem } from "../src/types/user";

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
  expect(shouldHideHomeNavigation("subscriptions", true, "user-a")).toBe(true);
  expect(shouldHideHomeNavigation("history", true, "user-a")).toBe(true);

  // If home is the landing page, never hide home button even if recommendations are hidden
  expect(shouldHideHomeNavigation("home", true, "user-a")).toBe(false);

  // If recommendations are NOT hidden, do not hide home button
  expect(shouldHideHomeNavigation("subscriptions", false, "user-a")).toBe(false);
  expect(shouldHideHomeNavigation("home", false, "user-a")).toBe(false);
});

test("scopes stored landing settings by user", () => {
  expect(readStoredDefaultLandingPath("user-a")).toBeNull();

  syncStoredLandingSettings("subscriptions", true, "user-a");
  syncStoredLandingSettings("history", false, "user-b");

  expect(readStoredDefaultLandingPath("user-a")).toBe("/subscriptions");
  expect(readStoredDefaultLandingPath("user-b")).toBe("/history");
  expect(readStoredLandingSettings("user-a")).toEqual({
    defaultLandingPage: "subscriptions",
    hideHomeRecommendations: true,
  });
});

test("clears cached settings for a user", () => {
  const settings = {
    defaultLandingPage: "history",
    hideHomeRecommendations: true,
  } as SettingsItem;
  syncStoredLandingSettings("subscriptions", true, "user-a");
  writeSettingsCache(settings, "user-a");

  clearUserCaches("user-a");

  expect(readStoredDefaultLandingPath("user-a")).toBeNull();
  expect(readSettingsCache("user-a")).toBeNull();
});

test("clears stored landing settings for a user", () => {
  syncStoredLandingSettings("subscriptions", true, "user-a");
  clearStoredLandingSettings("user-a");
  expect(readStoredLandingSettings("user-a")).toEqual({});
});
