import { expect, test } from "bun:test";
import { normalizeTextTrackCues } from "../src/lib/normalize-text-track";

type FakeCue = {
  startTime: number;
  endTime: number;
  text: string;
  align: string;
  line: number | string;
  position: number | string;
  size: number;
};

const cue = (startTime: number, text: string): FakeCue => ({
  startTime,
  endTime: startTime + 1,
  text,
  align: "start",
  line: 0,
  position: 0,
  size: 50,
});

function fakeTrack(cues: FakeCue[]) {
  const list = [...cues];
  return {
    get cues() {
      return list as unknown as TextTrackCueList;
    },
    removeCue(item: FakeCue) {
      list.splice(list.indexOf(item), 1);
    },
    list,
  };
}

test("drops repeated cues and centres the others at the bottom", () => {
  const track = fakeTrack([cue(1, "Whoa"), cue(1, "Whoa"), cue(1, "Other line"), cue(3, "Whoa")]);
  normalizeTextTrackCues(track as unknown as TextTrack);
  expect(track.list.map((item) => `${item.startTime}-${item.text}`)).toEqual([
    "1-Whoa",
    "1-Other line",
    "3-Whoa",
  ]);
  for (const item of track.list) {
    expect([item.align, item.line, item.position, item.size]).toEqual([
      "center",
      "auto",
      "auto",
      100,
    ]);
  }
});
