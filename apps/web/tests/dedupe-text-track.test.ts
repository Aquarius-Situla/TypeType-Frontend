import { expect, test } from "bun:test";
import { dedupeTextTrackCues } from "../src/lib/dedupe-text-track";

type FakeCue = { startTime: number; endTime: number; text: string };

function fakeTrack(cues: FakeCue[]) {
  const list = [...cues];
  return {
    get cues() {
      return list as unknown as TextTrackCueList;
    },
    removeCue(cue: FakeCue) {
      list.splice(list.indexOf(cue), 1);
    },
    list,
  };
}

test("drops cues that repeat another cue's timing and text", () => {
  const track = fakeTrack([
    { startTime: 1, endTime: 2, text: "Whoa" },
    { startTime: 1, endTime: 2, text: "Whoa" },
    { startTime: 1, endTime: 2, text: "Other line" },
    { startTime: 3, endTime: 4, text: "Whoa" },
  ]);
  dedupeTextTrackCues(track as unknown as TextTrack);
  expect(track.list.map((cue) => `${cue.startTime}-${cue.text}`)).toEqual([
    "1-Whoa",
    "1-Other line",
    "3-Whoa",
  ]);
});
