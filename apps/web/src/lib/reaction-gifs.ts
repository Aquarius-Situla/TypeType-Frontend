// The Tyme reactions shown on error and block screens (transparent WebP). Multi-variant kinds
// rotate without repeating the previous asset.
const REACTIONS = {
  youtubeReconnect: ["/reactions/youtube-reconnect.webp"],
  familyListBlocked: ["/reactions/family-list-blocked.webp"],
  membersOnly: ["/reactions/members-only.webp"],
  notFound: ["/reactions/not-found.webp"],
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
