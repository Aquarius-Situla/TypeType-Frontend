import type { MusicTrack } from "./music-player";
export const SOUND_URLS = {
  hum: "/halloween/audio/sfx/hall-hum-loop.wav",
  clunk1: "/halloween/audio/sfx/hall-clunk-1.m4a",
  clunk2: "/halloween/audio/sfx/hall-clunk-2.m4a",
  clunk3: "/halloween/audio/sfx/hall-clunk-3.m4a",
  clunk4: "/halloween/audio/sfx/hall-clunk-4.m4a",
  powerDie: "/halloween/audio/sfx/power-die.m4a",
  flashlight: "/halloween/audio/sfx/flashlight-click.m4a",
  walk1: "/halloween/audio/steps/walk-1.m4a",
  walk2: "/halloween/audio/steps/walk-2.m4a",
  walk3: "/halloween/audio/steps/walk-3.m4a",
  walk4: "/halloween/audio/steps/walk-4.m4a",
  walk5: "/halloween/audio/steps/walk-5.m4a",
  walk6: "/halloween/audio/steps/walk-6.m4a",
  walk7: "/halloween/audio/steps/walk-7.m4a",
  walk8: "/halloween/audio/steps/walk-8.m4a",
  run1: "/halloween/audio/steps/run-1.m4a",
  run2: "/halloween/audio/steps/run-2.m4a",
  run3: "/halloween/audio/steps/run-3.m4a",
  run4: "/halloween/audio/steps/run-4.m4a",
  run5: "/halloween/audio/steps/run-5.m4a",
  run6: "/halloween/audio/steps/run-6.m4a",
  run7: "/halloween/audio/steps/run-7.m4a",
  run8: "/halloween/audio/steps/run-8.m4a",
} as const;

export type SoundName = keyof typeof SOUND_URLS;

export const BANK_CLUNKS: readonly SoundName[] = ["clunk1", "clunk3", "clunk2", "clunk4"];

export const WALK_STEPS: readonly SoundName[] = [
  "walk1",
  "walk2",
  "walk3",
  "walk4",
  "walk5",
  "walk6",
  "walk7",
  "walk8",
];

export const RUN_STEPS: readonly SoundName[] = [
  "run1",
  "run2",
  "run3",
  "run4",
  "run5",
  "run6",
  "run7",
  "run8",
];

export const MUSIC_LEVEL = 0.5;

export const MUSIC = {
  creepingDown: { url: "/halloween/audio/music/creeping-down.m4a", loopStart: 1, loopEnd: 111.5 },
  sickness: { url: "/halloween/audio/music/sickness.m4a", loopStart: 3, loopEnd: 145.4 },
  credits: {
    url: "/halloween/audio/music/spooky-scary-skeletons.m4a",
    loopStart: 0,
    loopEnd: 60.3,
  },
} as const satisfies Record<string, MusicTrack>;
