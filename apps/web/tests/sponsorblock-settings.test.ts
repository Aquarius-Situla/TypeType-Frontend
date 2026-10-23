import { expect, test } from "bun:test";
import {
  filterAutoSkipSponsorBlockSegments,
  getSponsorBlockEndTime,
  getSponsorBlockStartTime,
} from "../src/lib/sponsorblock-settings";
import type { SponsorBlockSegmentItem } from "../src/types/api";
import type { SettingsItem } from "../src/types/user";

const defaultSettings = {
  sponsorBlockMode: "auto_skip",
  sponsorBlockCategoryActions: {
    sponsor: "auto_skip",
    intro: "auto_skip",
    outro: "auto_skip",
    interaction: "auto_skip",
    selfpromo: "auto_skip",
    music_offtopic: "auto_skip",
    preview: "auto_skip",
    filler: "auto_skip",
    poi_highlight: "auto_skip",
    chapter: "auto_skip",
  },
  sponsorBlockMinimumDuration: 0,
  sponsorBlockManualSkipOnFullVideo: true,
  sponsorBlockSkipNonMusicOnlyOnMusicVideos: false,
} as unknown as SettingsItem;

test("clamps SponsorBlock end time to video duration", () => {
  const normalSegment: SponsorBlockSegmentItem = {
    startTime: 10,
    endTime: 30,
    category: "sponsor",
    action: "skip",
  };
  expect(getSponsorBlockStartTime(normalSegment, 100)).toBe(10);
  expect(getSponsorBlockEndTime(normalSegment, 100)).toBe(30);

  const trollSegment: SponsorBlockSegmentItem = {
    startTime: 1151,
    endTime: 76858450,
    category: "sponsor",
    action: "skip",
  };
  // 100 hours = 365142s. End time clamped to duration
  expect(getSponsorBlockEndTime(trollSegment, 365142)).toBe(76858.45);
  expect(getSponsorBlockEndTime(trollSegment, 1000)).toBe(1000);
});

test("filters out troll segments and excessively long segments from auto-skip", () => {
  const trollSegment: SponsorBlockSegmentItem = {
    startTime: 1151,
    endTime: 76858450,
    category: "sponsor",
    action: "skip",
  };
  const normalSegment: SponsorBlockSegmentItem = {
    startTime: 60,
    endTime: 90,
    category: "sponsor",
    action: "skip",
  };

  const filtered = filterAutoSkipSponsorBlockSegments(
    [normalSegment, trollSegment],
    defaultSettings,
    365142,
    undefined,
  );

  expect(filtered).toEqual([normalSegment]);
});
