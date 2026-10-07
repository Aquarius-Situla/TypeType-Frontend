import { useQuery } from "@tanstack/react-query";
import { fetchBulletComments } from "../lib/api-bullet-comments";

export function useBulletComments(videoUrl: string, enabled: boolean) {
  console.log("[useBulletComments hook called]", { videoUrl, enabled });
  return useQuery({
    queryKey: ["bullet-comments", videoUrl],
    queryFn: () => {
      console.log("[useBulletComments queryFn running for]", videoUrl);
      return fetchBulletComments(videoUrl);
    },
    enabled: enabled && videoUrl.length > 0,
    staleTime: Number.POSITIVE_INFINITY,
    select: (data) => data.comments,
  });
}
