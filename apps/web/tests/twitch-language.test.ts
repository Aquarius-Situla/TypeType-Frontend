import { describe, expect, test } from "bun:test";
import {
  languageLabel,
  languageQuery,
  sanitizeLanguages,
  TWITCH_LANGUAGES,
  toggleLanguage,
} from "../src/lib/twitch-language";

describe("languageQuery", () => {
  test("is empty for every language and lower case otherwise", () => {
    expect(languageQuery([])).toBeUndefined();
    expect(languageQuery(["DE", "EN"])).toBe("de,en");
    expect(languageQuery(["ZH_HK"])).toBe("zh_hk");
  });
});

describe("sanitizeLanguages", () => {
  test("drops unknown, repeated and non text values and keeps list order", () => {
    expect(sanitizeLanguages(["EN", "xx", "DE", "EN", 3, null])).toEqual(["DE", "EN"]);
    expect(sanitizeLanguages("DE")).toEqual([]);
    expect(sanitizeLanguages(undefined)).toEqual([]);
  });
});

describe("toggleLanguage", () => {
  test("adds and removes one language", () => {
    expect(toggleLanguage([], "DE")).toEqual(["DE"]);
    expect(toggleLanguage(["EN"], "DE")).toEqual(["DE", "EN"]);
    expect(toggleLanguage(["DE", "EN"], "DE")).toEqual(["EN"]);
  });
});

describe("languageLabel", () => {
  test("names a language in the interface language", () => {
    expect(languageLabel("DE", "en", "Other")).toBe("German");
    expect(languageLabel("DE", "de", "Other")).toBe("Deutsch");
    expect(languageLabel("OTHER", "en", "Other")).toBe("Other");
  });

  test("every code has a label of its own", () => {
    const labels = TWITCH_LANGUAGES.map((code) => languageLabel(code, "en", "Other"));
    expect(new Set(labels).size).toBe(TWITCH_LANGUAGES.length);
  });
});
