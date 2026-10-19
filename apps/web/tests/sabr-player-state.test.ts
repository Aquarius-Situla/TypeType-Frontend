import { expect, test } from "bun:test";
import { isMediaAttachmentBusy } from "../src/hooks/use-sabr-player-state";

test("keeps the player busy while the media source is detached", () => {
  expect(isMediaAttachmentBusy("emptied")).toBe(true);
  expect(isMediaAttachmentBusy("loadstart")).toBe(true);
  expect(isMediaAttachmentBusy("loadedmetadata")).toBe(false);
  expect(isMediaAttachmentBusy("canplay")).toBe(false);
});
