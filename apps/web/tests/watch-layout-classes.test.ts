import { expect, test } from "bun:test";
import {
  getWatchLayoutClasses,
  getWatchSecondaryMetaContainerClass,
} from "../src/components/watch-layout-classes";

test("exposes stable watch hooks without changing the player identity", () => {
  const classes = getWatchLayoutClasses(false, false);

  expect(classes.containerClass).toContain("watch-layout-container");
  expect(classes.playerWrapClass).toContain("watch-player-wrap");
  expect(classes.playerBoxClass).toContain("watch-player-box");
  expect(classes.playerBoxClass).toContain("watch-player-anchor");
  expect(classes.playerClassName).toBe("watch-player-surface");
});

test("keeps cinema sizing alongside the mobile landscape hooks", () => {
  const classes = getWatchLayoutClasses(true, false);

  expect(classes.playerBoxClass).toContain("aspect-video");
  expect(classes.playerBoxClass).not.toContain("watch-player-anchor");
  expect(classes.playerClassName).toContain("[--video-aspect-ratio:16/9]");
  expect(classes.playerClassName).toContain("watch-player-surface");
});

test("produces full-viewport classes for web fullscreen mode", () => {
  const classes = getWatchLayoutClasses(false, false, true);

  expect(classes.playerWrapClass).toContain("fixed");
  expect(classes.playerWrapClass).toContain("inset-0");
  expect(classes.playerWrapClass).toContain("w-screen");
  expect(classes.playerWrapClass).toContain("h-screen");
  expect(classes.playerWrapClass).toContain("z-50");
  expect(classes.playerBoxClass).toContain("w-full");
  expect(classes.playerBoxClass).toContain("h-full");
  expect(classes.playerBoxClass).not.toContain("watch-player-anchor");
  expect(classes.playerClassName).toBe("watch-player-surface w-full h-full dark rounded-none");
});

test("expands secondary meta container to full width when side content is absent", () => {
  const withSide = getWatchSecondaryMetaContainerClass(true);
  expect(withSide).toContain("flex-[2]");
  expect(withSide).toContain("max-w-[1200px]");

  const withoutSide = getWatchSecondaryMetaContainerClass(false);
  expect(withoutSide).toContain("w-full");
  expect(withoutSide).toContain("max-w-full");
  expect(withoutSide).not.toContain("flex-[2]");
});
