import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { fetchProgress, fetchProgressBatch, updateProgress } from "../lib/api-collections";
import { debugConsole } from "../lib/debug-console";
import {
  type HistoryPageData,
  type HistoryPagesData,
  updateHistoryPageProgress,
  updateHistoryPagesProgress,
} from "../lib/history-progress-cache";
import { getBatchLocalProgress, getLocalProgress, saveLocalProgress } from "../lib/local-progress";
import { progressItemsByUrl, updateProgressItems, videoProgressUrl } from "../lib/video-progress";
import { reconcileProgressItem } from "../lib/watch-resume";
import { useAuthStore } from "../stores/auth-store";
import type { VideoStream } from "../types/stream";
import type { ProgressItem } from "../types/user";
import { useAuth } from "./use-auth";

export function useProgress(videoUrl: string) {
  const { authReady, isAuthed } = useAuth();
  return useQuery({
    queryKey: ["progress", videoUrl],
    initialData: () => {
      const cached = getLocalProgress(videoUrl);
      if (cached && cached.position > 0) {
        debugConsole("progress.frame0_hit", {
          videoUrl,
          position: cached.position,
          updatedAt: cached.updatedAt,
        });
        return cached;
      }
      return undefined;
    },
    queryFn: async () => {
      const local = getLocalProgress(videoUrl);
      if (!isAuthed) {
        return local ?? { videoUrl, position: 0, updatedAt: 0 };
      }
      try {
        const server = await fetchProgress(videoUrl);
        const { chosen, shouldSyncServer, shouldSyncLocal } = reconcileProgressItem(local, server);
        if (shouldSyncServer) {
          void updateProgress(videoUrl, chosen.position, false).catch(() => {});
        }
        if (shouldSyncLocal) {
          saveLocalProgress(videoUrl, chosen.position, chosen.updatedAt);
        }
        return chosen;
      } catch {
        return local ?? { videoUrl, position: 0, updatedAt: 0 };
      }
    },
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    enabled: authReady && videoUrl.length > 0,
  });
}

export function useVideoProgressMap(streams: VideoStream[]): Map<string, ProgressItem> {
  const { authReady, isAuthed } = useAuth();
  const videoUrls = useMemo(() => [...new Set(streams.map(videoProgressUrl))].sort(), [streams]);
  const query = useQuery({
    queryKey: ["progress-batch", videoUrls],
    queryFn: async () => {
      const localMap = getBatchLocalProgress(videoUrls);
      if (!isAuthed) return Array.from(localMap.values());
      try {
        const serverItems = await fetchProgressBatch(videoUrls);
        const merged = new Map(localMap);
        for (const item of serverItems) {
          const loc = localMap.get(item.videoUrl);
          const { chosen, shouldSyncLocal } = reconcileProgressItem(loc, item);
          merged.set(item.videoUrl, chosen);
          if (shouldSyncLocal) {
            saveLocalProgress(item.videoUrl, chosen.position, chosen.updatedAt);
          }
        }
        return Array.from(merged.values());
      } catch {
        return Array.from(localMap.values());
      }
    },
    enabled: authReady && videoUrls.length > 0,
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
  return useMemo(() => progressItemsByUrl(query.data ?? []), [query.data]);
}

export function useSaveProgress(videoUrl: string) {
  const { authReady, isAuthed } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    onMutate: async ({ position }) => {
      saveLocalProgress(videoUrl, position);
      const next: ProgressItem = {
        videoUrl,
        position: Math.round(position),
        updatedAt: Date.now(),
      };
      qc.setQueryData(["progress", videoUrl], next);
      qc.setQueriesData<ProgressItem[]>({ queryKey: ["progress-batch"] }, (items) =>
        updateProgressItems(items, next),
      );
      if (authReady && isAuthed) {
        qc.setQueriesData<HistoryPagesData>({ queryKey: ["history"] }, (data) =>
          updateHistoryPagesProgress(data, videoUrl, position),
        );
        qc.setQueriesData<HistoryPageData>({ queryKey: ["history-filtered"] }, (data) =>
          updateHistoryPageProgress(data, videoUrl, position),
        );
      }
    },
    mutationFn: ({ position, keepalive }: { position: number; keepalive: boolean }) => {
      const token = useAuthStore.getState().token;
      return token ? updateProgress(videoUrl, position, keepalive) : Promise.resolve();
    },
    onSuccess: (_, { position }) => {
      if (!authReady || !isAuthed || !useAuthStore.getState().token) return;
      const next: ProgressItem = {
        videoUrl,
        position: Math.round(position),
        updatedAt: Date.now(),
      };
      qc.setQueryData(["progress", videoUrl], next);
    },
  });
}
