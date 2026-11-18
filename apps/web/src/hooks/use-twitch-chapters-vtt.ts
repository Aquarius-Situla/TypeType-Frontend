import { useQuery } from "@tanstack/react-query";
import { fetchTwitchVideoChapters } from "../lib/api-twitch";
import { buildChaptersVtt } from "../lib/chapters-vtt";
import { useKeyedObjectUrl } from "./use-keyed-object-url";

// The game changes of a past broadcast as timeline chapters; one game for the whole video is not worth a chapter.
export function useTwitchChaptersVtt(videoId: string, lengthSeconds: number): string | undefined {
  const { data } = useQuery({
    queryKey: ["twitch", "chapters", videoId],
    queryFn: () => fetchTwitchVideoChapters(videoId),
    staleTime: 30 * 60_000,
    retry: false,
  });
  const chapters = data && data.length > 1 ? data : [];
  const key = `${videoId}:${lengthSeconds}:${chapters.map((chapter) => `${chapter.start}:${chapter.title}`).join("|")}`;
  const url = useKeyedObjectUrl(key, () =>
    buildChaptersVtt(
      chapters.map((chapter) => ({
        title: chapter.title,
        startTimeSeconds: chapter.start,
        channelName: null,
        url: null,
        previewUrl: null,
      })),
      lengthSeconds,
    ),
  );
  return url ?? undefined;
}
