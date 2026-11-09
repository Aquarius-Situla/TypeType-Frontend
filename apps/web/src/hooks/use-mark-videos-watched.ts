import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProgress } from "../lib/api-collections";
import { saveLocalProgress } from "../lib/local-progress";
import { videoProgressUrl } from "../lib/video-progress";
import type { VideoStream } from "../types/stream";
import { useAuth } from "./use-auth";

const PARALLEL_WRITES = 6;

export function canMarkWatched(stream: VideoStream): boolean {
  return !stream.isLive && stream.duration > 0;
}

export function useMarkVideosWatched() {
  const { authReady, isAuthed, me } = useAuth();
  const userId = isAuthed ? me?.id : null;
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ streams, watched }: { streams: VideoStream[]; watched: boolean }) => {
      const marks = streams.filter(canMarkWatched).map((stream) => ({
        url: videoProgressUrl(stream),
        position: watched ? stream.duration * 1_000 : 0,
      }));
      const now = Date.now();
      if (authReady && (!isAuthed || userId)) {
        for (const mark of marks) saveLocalProgress(mark.url, mark.position, now, userId);
      }
      if (isAuthed) {
        for (let index = 0; index < marks.length; index += PARALLEL_WRITES) {
          await Promise.all(
            marks
              .slice(index, index + PARALLEL_WRITES)
              .map((mark) => updateProgress(mark.url, mark.position)),
          );
        }
      }
      return marks.length;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["progress-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}
