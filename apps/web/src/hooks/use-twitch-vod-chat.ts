import { useEffect, useRef, useState } from "react";
import { fetchTwitchVideoComments } from "../lib/api-twitch";
import {
  nextVodChatFailure,
  type VodChatFailure,
  vodChatBlocked,
} from "../lib/twitch-vod-chat-failure";
import { trimPlayedComments } from "../lib/twitch-vod-chat-window";
import type { TwitchVideoComment } from "../types/twitch";

const VISIBLE = 150;
const PREFETCH_SECONDS = 20;
const SEEK_GAP_SECONDS = 60;

type Window = {
  videoId: string;
  comments: TwitchVideoComment[];
  cursor?: string;
  hasMore: boolean;
  from: number;
  until: number;
};

// The chat of a past broadcast follows the playback position: one page from where the viewer is, the next page a
// little before it runs out, and a fresh page from the new position after a seek outside what is loaded.
export function useTwitchVodChat(
  videoId: string,
  seconds: number,
): { comments: TwitchVideoComment[]; ready: boolean; unavailable: boolean } {
  const [window, setWindow] = useState<Window | null>(null);
  const [failure, setFailure] = useState<VodChatFailure | null>(null);
  const loading = useRef(false);

  useEffect(() => {
    if (loading.current || vodChatBlocked(failure, videoId, Date.now())) return;
    const current = window?.videoId === videoId ? window : null;
    const outside =
      !current || seconds < current.from - 1 || seconds > current.until + SEEK_GAP_SECONDS;
    const needsMore =
      current?.hasMore && current.cursor && seconds > current.until - PREFETCH_SECONDS;
    if (!outside && !needsMore) return;
    loading.current = true;
    const request = outside ? { offset: seconds } : { cursor: current?.cursor };
    fetchTwitchVideoComments(videoId, request)
      .then((page) => {
        setFailure(null);
        const last = page.items.at(-1)?.offset;
        setWindow((previous) => {
          if (outside || !previous || previous.videoId !== videoId) {
            return {
              videoId,
              comments: page.items,
              cursor: page.cursor,
              hasMore: page.hasMore,
              from: seconds,
              until: last ?? seconds,
            };
          }
          const known = new Set(previous.comments.map((comment) => comment.id));
          const comments = trimPlayedComments(
            [...previous.comments, ...page.items.filter((comment) => !known.has(comment.id))],
            seconds,
            VISIBLE,
          );
          return {
            ...previous,
            comments,
            from: comments[0]?.offset ?? previous.from,
            cursor: page.cursor,
            hasMore: page.hasMore,
            until: last ?? previous.until,
          };
        });
      })
      .catch((error: unknown) => {
        setFailure((previous) => nextVodChatFailure(previous, videoId, error, Date.now()));
      })
      .finally(() => {
        loading.current = false;
      });
  }, [videoId, seconds, window, failure]);

  const current = window?.videoId === videoId ? window : null;
  const visible = current
    ? current.comments.filter((comment) => comment.offset <= seconds).slice(-VISIBLE)
    : [];
  const unavailable = failure?.videoId === videoId && failure.missing && current === null;
  return { comments: visible, ready: current !== null, unavailable };
}
