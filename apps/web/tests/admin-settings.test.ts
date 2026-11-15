import { describe, expect, test } from "bun:test";
import { isAdminSettings } from "../src/lib/api-admin";
import type { AdminSettings } from "../src/types/admin";

const baseSettings: AdminSettings = {
  name: "TypeType",
  tagline: null,
  logoUrl: null,
  bannerUrl: null,
  minAndroidClientVersion: null,
  allowRegistration: true,
  allowGuest: true,
  forceEmailVerification: false,
  activeSessionsEnabled: false,
  localLoginEnabled: true,
  oidcAutoRedirect: false,
  accessMode: "unrestricted",
  rssEnabled: false,
  rssPublicBaseUrl: null,
  rssMaxFeedsPerUser: 10,
  rssMaxItems: 50,
  rssMinimumPollMinutes: 5,
  rssRateLimitPerMinute: 30,
};

describe("isAdminSettings", () => {
  test("accepts settings with or without applyParentalControlsToAdmins", () => {
    expect(isAdminSettings(baseSettings)).toBe(true);
    expect(isAdminSettings({ ...baseSettings, applyParentalControlsToAdmins: false })).toBe(true);
    expect(isAdminSettings({ ...baseSettings, applyParentalControlsToAdmins: true })).toBe(true);
  });

  test("rejects non-boolean applyParentalControlsToAdmins", () => {
    expect(isAdminSettings({ ...baseSettings, applyParentalControlsToAdmins: "yes" })).toBe(false);
  });
});
