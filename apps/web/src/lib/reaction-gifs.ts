// The animated reactions of the loading and error screens (animated WebP: soft cut-out edges). Each situation has several: a screen
// draws one at random when it shows, never the one it showed last, so they take turns.
const REACTIONS = {
  loading: ["/loader-mascot.gif", "/reactions/loading-1.webp", "/reactions/loading-2.webp"],
  videoError: [
    "/reactions/video-error-1.webp",
    "/reactions/video-error-2.webp",
    "/reactions/video-error-3.webp",
  ],
  playbackError: [
    "/reactions/playback-error-1.webp",
    "/reactions/playback-error-2.webp",
    "/reactions/playback-error-3.webp",
    "/reactions/playback-error-4.webp",
    "/reactions/playback-error-5.webp",
    "/reactions/playback-error-6.webp",
  ],
  youtubeReconnect: [
    "/reactions/youtube-reconnect-1.webp",
    "/reactions/youtube-reconnect-2.webp",
    "/reactions/youtube-reconnect-3.webp",
    "/reactions/youtube-reconnect-4.webp",
  ],
  familyListBlocked: [
    "/reactions/family-list-blocked-1.webp",
    "/reactions/family-list-blocked-2.webp",
  ],
  membersOnly: [
    "/reactions/members-only-1.webp",
    "/reactions/members-only-2.webp",
    "/reactions/members-only-3.webp",
  ],
  notFound: [
    "/reactions/not-found-1.webp",
    "/reactions/not-found-2.webp",
    "/reactions/not-found-3.webp",
  ],
  guestDisabled: [
    "/reactions/guest-disabled-1.webp",
    "/reactions/guest-disabled-2.webp",
    "/reactions/guest-disabled-3.webp",
  ],
} as const satisfies Record<string, readonly string[]>;

export type ReactionKind = keyof typeof REACTIONS;

const lastShown = new Map<ReactionKind, string>();

export function reactionsFor(kind: ReactionKind): readonly string[] {
  return REACTIONS[kind];
}

// `random` returns a number in [0, 1), as Math.random does.
export function pickReaction(kind: ReactionKind, random: () => number = Math.random): string {
  const all = REACTIONS[kind];
  const choices = all.length > 1 ? all.filter((src) => src !== lastShown.get(kind)) : all;
  const src = choices[Math.floor(random() * choices.length)] ?? all[0];
  lastShown.set(kind, src);
  return src;
}
