import type { TwitchVideoComment } from "../types/twitch";

// Keeps every comment still ahead of the position and only the last `behind` already shown: a long broadcast
// watched to the end otherwise holds its whole chat in memory and filters all of it every second.
export function trimPlayedComments(
  comments: TwitchVideoComment[],
  seconds: number,
  behind: number,
): TwitchVideoComment[] {
  let played = 0;
  for (const comment of comments) if (comment.offset <= seconds) played++;
  const drop = played - behind;
  return drop > 0 ? comments.slice(drop) : comments;
}
