import { expect, test } from "bun:test";
import { hasMultipleLanguageTracks } from "../src/components/player-language";

test("distinguishes multiple bitrate tracks from multiple languages", () => {
  expect(
    hasMultipleLanguageTracks([{ track: { language: "fr-FR" } }, { track: { language: "fr-CA" } }]),
  ).toBe(false);
  expect(
    hasMultipleLanguageTracks([{ track: { language: "fr-FR" } }, { track: { language: "en-US" } }]),
  ).toBe(true);
});

test("ignores missing language tags", () => {
  expect(
    hasMultipleLanguageTracks([
      { track: { language: "fr-FR" } },
      { track: { language: null } },
      { track: {} },
    ]),
  ).toBe(false);
});
