import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProgressMany } from "../lib/api-collections";
import { saveLocalProgress } from "../lib/local-progress";
import { clearInactiveStreamCache } from "../lib/stream-request";
import { videoProgressUrl } from "../lib/video-progress";
import type { VideoStream } from "../types/stream";
import { useAuth } from "./use-auth";

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
      if (!authReady || (isAuthed && !userId)) return 0;
      if (!isAuthed) {
        for (const mark of marks) saveLocalProgress(mark.url, mark.position, Date.now(), null);
        return marks.length;
      }
      await updateProgressMany(marks);
      const savedAt = Date.now();
      for (const mark of marks) saveLocalProgress(mark.url, mark.position, savedAt, userId);
      return marks.length;
    },
    onSettled: (_data, _error, { streams }) => {
      void queryClient.invalidateQueries({ queryKey: ["progress-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["progress"] });
      for (const stream of streams) {
        if (canMarkWatched(stream)) {
          clearInactiveStreamCache(queryClient, videoProgressUrl(stream));
        }
      }
    },
  });
}
