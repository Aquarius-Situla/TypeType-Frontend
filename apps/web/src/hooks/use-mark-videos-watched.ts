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
      if (!authReady || (isAuthed && !userId)) return 0;
      if (!isAuthed) {
        for (const mark of marks) saveLocalProgress(mark.url, mark.position, Date.now(), null);
        return marks.length;
      }
      let failed = 0;
      for (let index = 0; index < marks.length; index += PARALLEL_WRITES) {
        const chunk = marks.slice(index, index + PARALLEL_WRITES);
        const results = await Promise.allSettled(
          chunk.map((mark) => updateProgress(mark.url, mark.position)),
        );
        results.forEach((result, position) => {
          if (result.status === "rejected") {
            failed += 1;
            return;
          }
          saveLocalProgress(chunk[position].url, chunk[position].position, Date.now(), userId);
        });
      }
      if (failed > 0) throw new Error(`${failed} of ${marks.length} videos were not updated`);
      return marks.length;
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ["progress-batch"] });
      void queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}
