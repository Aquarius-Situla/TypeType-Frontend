import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { pickReaction, type ReactionKind, reactionsFor } from "../src/lib/reaction-gifs";

const KINDS: ReactionKind[] = [
  "loading",
  "videoError",
  "playbackError",
  "youtubeReconnect",
  "familyListBlocked",
  "membersOnly",
  "notFound",
  "guestDisabled",
];
const PUBLIC = join(import.meta.dir, "..", "public");

test("every reaction is a file the app ships", () => {
  for (const kind of KINDS) {
    expect(reactionsFor(kind).length).toBeGreaterThan(1);
    for (const src of reactionsFor(kind)) expect(existsSync(join(PUBLIC, src))).toBe(true);
  }
});

test("a screen never shows the same reaction twice in a row", () => {
  for (const kind of KINDS) {
    let before = pickReaction(kind);
    for (let draw = 0; draw < 40; draw += 1) {
      const next = pickReaction(kind);
      expect(next).not.toBe(before);
      before = next;
    }
  }
});

test("every reaction of a kind comes up", () => {
  const seen = new Set<string>();
  for (let draw = 0; draw < 200; draw += 1) seen.add(pickReaction("playbackError"));
  expect(seen.size).toBe(reactionsFor("playbackError").length);
});

test("the startup screen draws from the same loading reactions", () => {
  const page = readFileSync(join(import.meta.dir, "..", "index.html"), "utf8");
  const list = page.match(/const gifs = (\[[^\]]*\])/)?.[1];
  expect(list ? JSON.parse(list) : null).toEqual([...reactionsFor("loading")]);
});
