const range = (prefix: string, count: number): string[] =>
  Array.from({ length: count }, (_, i) => `/halloween/audio/ambience/${prefix}-${i + 1}.m4a`);

export const AMBIENCE = {
  tvStatic: "/halloween/audio/ambience/tv-static.wav",
  crtOff: "/halloween/audio/sfx/crt-off.m4a",
  skinStretch: "/halloween/audio/sfx/skin-stretch.m4a",
  neckCracks: [1, 2, 3, 4, 5].map((n) => `/halloween/audio/sfx/neck-crack-${n}.m4a`),
  neckSnap: "/halloween/audio/sfx/neck-crack-heavy.m4a",
  doorCreak: "/halloween/audio/sfx/door-creak-slow.m4a",
  stairDraft: "/halloween/audio/ambience/stair-draft.wav",
  stoneSeal: "/halloween/audio/sfx/stone-seal.m4a",
  neonBuzz: "/halloween/audio/ambience/neon-buzz.wav",
  screenOn: "/halloween/audio/sfx/screen-on.m4a",
  easAlarm: "/halloween/audio/sfx/eas-alarm.m4a",
  babyCry: "/halloween/audio/nursery/baby-cry.m4a",
  aveMaria: "/halloween/audio/nursery/ave-maria.m4a",
  floorCreak: "/halloween/audio/nursery/floor-creak.m4a",
  plushDrop: "/halloween/audio/sfx/plush-drop.m4a",
  lampFlicker: "/halloween/audio/sfx/lamp-flicker.m4a",
  cave: range("cave", 23),
  metal: [...range("metal", 5), ...range("thud", 1)],
  door: range("door", 2),
  disc11: ["run", "mumble", "heart"].map((name) => `/halloween/audio/ambience/disc11-${name}.m4a`),
} as const;

export const DISTANT_POOL: readonly string[] = [
  ...AMBIENCE.cave,
  ...AMBIENCE.cave,
  ...AMBIENCE.metal,
  AMBIENCE.door[1] ?? "",
  ...AMBIENCE.disc11,
].filter(Boolean);
export const DISTANT_FILES: readonly string[] = [
  ...DISTANT_POOL,
  AMBIENCE.tvStatic,
  AMBIENCE.crtOff,
  AMBIENCE.skinStretch,
  ...AMBIENCE.neckCracks,
  AMBIENCE.neckSnap,
  AMBIENCE.doorCreak,
  AMBIENCE.stairDraft,
  AMBIENCE.stoneSeal,
  AMBIENCE.neonBuzz,
  AMBIENCE.screenOn,
  AMBIENCE.easAlarm,
  AMBIENCE.babyCry,
  AMBIENCE.aveMaria,
  AMBIENCE.floorCreak,
  AMBIENCE.plushDrop,
  AMBIENCE.lampFlicker,
  AMBIENCE.door[0] ?? "",
].filter(Boolean);
