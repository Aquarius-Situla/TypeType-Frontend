import { expect, test } from "bun:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WatchPlaylistAudioOnlyToggle } from "../src/components/watch-playlist-controls";
import {
  playlistAudioOnlyKey,
  resolvePlaylistAudioOnly,
  updatePlaylistAudioOnlyOverrides,
} from "../src/hooks/use-playlist-audio-only";
import { resolveAudioOnlyModeTransition } from "../src/lib/audio-only-mode-transition";

test("playlist audio-only overrides are scoped by user and playlist", () => {
  const firstUserKey = playlistAudioOnlyKey("user-1", "list:youtube:abc");
  const secondUserKey = playlistAudioOnlyKey("user-2", "list:youtube:abc");
  const anotherPlaylistKey = playlistAudioOnlyKey("user-1", "list:youtube:def");
  const overrides = updatePlaylistAudioOnlyOverrides({}, firstUserKey, true);

  expect(resolvePlaylistAudioOnly(overrides, firstUserKey, false)).toBe(true);
  expect(resolvePlaylistAudioOnly(overrides, secondUserKey, false)).toBe(false);
  expect(resolvePlaylistAudioOnly(overrides, anotherPlaylistKey, true)).toBe(true);
  expect(resolvePlaylistAudioOnly(overrides, undefined, true)).toBe(true);
});

test("playlist audio-only overrides keep the most recently changed entries", () => {
  const overrides = Object.fromEntries(
    Array.from({ length: 32 }, (_, index) => [`user:list-${index}`, false]),
  );
  const updated = updatePlaylistAudioOnlyOverrides(overrides, "user:new-list", true);

  expect(Object.keys(updated)).toHaveLength(32);
  expect(updated["user:list-0"]).toBeUndefined();
  expect(updated["user:new-list"]).toBe(true);
});

test("changing playlist audio-only mode preserves the current playback position", () => {
  const transition = resolveAudioOnlyModeTransition({
    paramChanged: false,
    defaultEnabled: true,
    positionMs: 8_400,
    fallbackPositionMs: 0,
  });

  expect(transition).toEqual({ active: true, switchPositionMs: 8_400 });
});

test("changing playlist videos does not reuse the previous audio switch position", () => {
  const transition = resolveAudioOnlyModeTransition({
    paramChanged: true,
    defaultEnabled: true,
    positionMs: null,
    fallbackPositionMs: 8_400,
  });

  expect(transition).toEqual({ active: true, switchPositionMs: null });
});

test("playlist audio-only control exposes its enabled state to assistive technology", () => {
  const html = renderToStaticMarkup(
    createElement(WatchPlaylistAudioOnlyToggle, { enabled: true, onToggle: () => undefined }),
  );

  expect(html).toContain('aria-pressed="true"');
});
