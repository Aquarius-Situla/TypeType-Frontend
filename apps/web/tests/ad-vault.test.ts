import { beforeEach, expect, test } from "bun:test";
import { nextAdIndex, trialIsEarned } from "../src/lib/ad-catalog";
import { wantsLightVideo } from "../src/lib/ad-media";
import {
  adIsDue,
  hasPremium,
  parseAdVault,
  readAdVault,
  rememberAdFinished,
  rememberAdPending,
  rememberEnding,
  rememberScene,
  wantAds,
} from "../src/lib/ad-vault";

const KEY = "typetype-sponsors";
const PENDING = { index: 2, time: 12.5, scene: "intro", seen: ["intro"], waiting: false };

beforeEach(() => {
  window.localStorage.removeItem(KEY);
});

test("no ad is due until the viewer asks for ads", () => {
  expect(nextAdIndex(readAdVault())).toBeNull();
  expect(nextAdIndex(wantAds(true))).toBe(0);
  expect(nextAdIndex(wantAds(false))).toBeNull();
});

test("an unfinished ad comes back before the next one", () => {
  wantAds(true);
  rememberAdFinished("squishy", 1);
  rememberAdPending(PENDING);
  expect(nextAdIndex(readAdVault())).toBe(2);
  expect(readAdVault().pending).toEqual(PENDING);
  rememberAdFinished("gravely", 3);
  expect(readAdVault().pending).toBeNull();
  expect(nextAdIndex(readAdVault())).toBe(3);
  expect(readAdVault().seen).toEqual(["squishy", "gravely"]);
});

test("turning ad mode off forgets the unfinished ad", () => {
  wantAds(true);
  rememberAdPending(PENDING);
  expect(wantAds(false).pending).toBeNull();
});

test("the five endings of the trial end the ads", () => {
  wantAds(true);
  for (const ending of [1, 2, 3, 3, 4]) rememberEnding(ending);
  expect(hasPremium(readAdVault())).toBe(false);
  expect(adIsDue(rememberEnding(5))).toBe(false);
  expect(nextAdIndex(readAdVault())).toBeNull();
});

test("the trial unlocks on the sponsors page once the six classic ads are seen", () => {
  const seen = ["squishy", "floatmax", "gravely", "mourning", "plummet"];
  expect(trialIsEarned(parseAdVault({ seen }))).toBe(false);
  expect(trialIsEarned(parseAdVault({ seen: [...seen, "backrooms"] }))).toBe(true);
});

test("a damaged vault is read as far as it makes sense", () => {
  window.localStorage.setItem(KEY, "{not json");
  expect(readAdVault().wanted).toBe(false);
  expect(parseAdVault(null).seen).toEqual([]);
  const vault = parseAdVault({
    wanted: "yes",
    next: 1.5,
    pending: { index: "2", scene: "intro" },
    seen: ["squishy", 4],
    endings: [1, "2", 3],
    scenes: ["intro", null],
  });
  expect(vault).toEqual({
    wanted: false,
    next: 0,
    pending: null,
    seen: ["squishy"],
    endings: [1, 3],
    scenes: ["intro"],
  });
  expect(nextAdIndex(parseAdVault({ wanted: true, next: 99 }))).toBe(0);
});

test("trial clips watched to the end are remembered once, across sessions", () => {
  rememberScene("intro");
  rememberScene("audience");
  expect(rememberScene("intro").scenes).toEqual(["intro", "audience"]);
  expect(readAdVault().scenes).toEqual(["intro", "audience"]);
});

test("the lighter videos go to slow or metered connections only", () => {
  expect(wantsLightVideo(undefined)).toBe(false);
  expect(wantsLightVideo({ effectiveType: "4g", downlink: 10 })).toBe(false);
  expect(wantsLightVideo({ effectiveType: "4g", downlink: 1.55 })).toBe(false);
  expect(wantsLightVideo({ effectiveType: "4g", downlink: 0.9 })).toBe(true);
  expect(wantsLightVideo({ effectiveType: "3g" })).toBe(true);
  expect(wantsLightVideo({ saveData: true, effectiveType: "4g", downlink: 10 })).toBe(true);
});
