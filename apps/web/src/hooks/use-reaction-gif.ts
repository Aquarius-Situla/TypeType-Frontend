import { useMemo } from "react";
import { pickReaction, type ReactionKind } from "../lib/reaction-gifs";

// One reaction per screen: drawn when the screen shows, kept while it stays up.
export function useReactionGif(kind: ReactionKind): string {
  return useMemo(() => pickReaction(kind), [kind]);
}
