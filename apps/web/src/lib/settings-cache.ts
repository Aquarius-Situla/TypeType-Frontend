import type { SettingsItem } from "../types/user";
import { clearStoredLandingSettings } from "./default-landing";

const SETTINGS_CACHE_PREFIX = "typetype-settings-cache";

function storage(): Storage | null {
  try {
    if (typeof window !== "undefined" && window.localStorage) return window.localStorage;
    if (typeof localStorage !== "undefined") return localStorage;
  } catch {}
  return null;
}

function userScope(userId?: string | null): string {
  const normalized = userId?.trim();
  return normalized ? encodeURIComponent(normalized) : "anonymous";
}

function settingsCacheKey(userId?: string | null): string {
  return `${SETTINGS_CACHE_PREFIX}:${userScope(userId)}`;
}

export function readSettingsCache(userId?: string | null): Partial<SettingsItem> | null {
  const target = storage();
  if (!target) return null;
  try {
    const raw = target.getItem(settingsCacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Partial<SettingsItem>) : null;
  } catch {
    return null;
  }
}

export function writeSettingsCache(settings: SettingsItem, userId?: string | null): void {
  const target = storage();
  if (!target) return;
  try {
    target.setItem(settingsCacheKey(userId), JSON.stringify(settings));
  } catch {}
}

export function clearUserCaches(userId?: string | null): void {
  storage()?.removeItem(settingsCacheKey(userId));
  clearStoredLandingSettings(userId);
}

export function clearLegacyUserCaches(): void {
  storage()?.removeItem(SETTINGS_CACHE_PREFIX);
}
