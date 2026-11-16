import { useEffect, useRef, useState } from "react";
import { fetchTwitchVideoComments } from "../lib/api-twitch";
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
): { comments: TwitchVideoComment[]; ready: boolean } {
  const [window, setWindow] = useState<Window | null>(null);
  const loading = useRef(false);

  useEffect(() => {
    if (loading.current) return;
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
          return {
            ...previous,
            comments: [
              ...previous.comments,
              ...page.items.filter((comment) => !known.has(comment.id)),
            ],
            cursor: page.cursor,
            hasMore: page.hasMore,
            until: last ?? previous.until,
          };
        });
      })
      .catch(() => undefined)
      .finally(() => {
        loading.current = false;
      });
  }, [videoId, seconds, window]);

  const current = window?.videoId === videoId ? window : null;
  const visible = current
    ? current.comments.filter((comment) => comment.offset <= seconds).slice(-VISIBLE)
    : [];
  return { comments: visible, ready: current !== null };
}
