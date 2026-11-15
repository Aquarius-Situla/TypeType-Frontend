import { expect, test } from "bun:test";
import { pickAudioTrack, pickSubtitleTrack } from "../src/lib/video-js-tracks";

const audio = [
  { id: "a1", label: "English", language: "en" },
  { id: "a2", label: "Français (original)", language: "fr" },
  { id: "a3", label: "Deutsch", language: "de" },
];

test("prefers the original audio when asked", () => {
  expect(pickAudioTrack(audio, { forceOriginal: true })?.id).toBe("a2");
  expect(pickAudioTrack(audio, { forceOriginal: true, originalId: "a3" })?.id).toBe("a3");
  expect(pickAudioTrack(audio, { forceOriginal: true, originalLocale: "de-DE" })?.id).toBe("a2");
});

test("uses the preferred track or language otherwise", () => {
  expect(pickAudioTrack(audio, { forceOriginal: false, preferredId: "a3" })?.id).toBe("a3");
  expect(pickAudioTrack(audio, { forceOriginal: false, preferredLanguage: "de" })?.id).toBe("a3");
  expect(pickAudioTrack([], { forceOriginal: true })).toBeNull();
});

test("picks subtitles only when enabled", () => {
  const text = [
    { id: "t1", kind: "metadata", language: "" },
    { id: "t2", kind: "subtitles", language: "fr" },
    { id: "t3", kind: "subtitles", language: "en" },
  ];
  expect(pickSubtitleTrack(text, false, "en")).toBeNull();
  expect(pickSubtitleTrack(text, true, "en")?.id).toBe("t3");
  expect(pickSubtitleTrack(text, true, undefined)?.id).toBe("t2");
});
