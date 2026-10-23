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
import {
  getBatchLocalProgress,
  getLocalProgress,
  progressCacheScope,
  saveLocalProgress,
} from "../lib/local-progress";
import { progressItemsByUrl, updateProgressItems, videoProgressUrl } from "../lib/video-progress";
import { reconcileProgressItem } from "../lib/watch-resume";
import { useAuthStore } from "../stores/auth-store";
import type { VideoStream } from "../types/stream";
import type { ProgressItem } from "../types/user";
import { useAuth } from "./use-auth";

export function useProgress(videoUrl: string) {
  const { authReady, isAuthed, me } = useAuth();
  const userId = isAuthed ? me?.id : null;
  const queryScope = progressCacheScope(userId);
  const localCacheAvailable = authReady && (!isAuthed || Boolean(userId));
  return useQuery({
    queryKey: ["progress", videoUrl, queryScope],
    initialData: () => {
      if (!localCacheAvailable) return undefined;
      const cached = getLocalProgress(videoUrl, userId);
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
      const local = localCacheAvailable ? getLocalProgress(videoUrl, userId) : null;
      if (!isAuthed) {
        return local ?? { videoUrl, position: 0, updatedAt: 0 };
      }
      if (!userId || useAuthStore.getState().me?.id !== userId) {
        return { videoUrl, position: 0, updatedAt: 0 };
      }
      try {
        const server = await fetchProgress(videoUrl);
        if (useAuthStore.getState().me?.id !== userId) {
          return local ?? { videoUrl, position: 0, updatedAt: 0 };
        }
        const { chosen, shouldSyncServer, shouldSyncLocal } = reconcileProgressItem(local, server);
        if (shouldSyncServer) {
          void updateProgress(videoUrl, chosen.position, false).catch(() => {});
        }
        if (shouldSyncLocal) {
          saveLocalProgress(videoUrl, chosen.position, chosen.updatedAt, userId);
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
    enabled: authReady && (!isAuthed || Boolean(userId)) && videoUrl.length > 0,
  });
}

export function useVideoProgressMap(streams: VideoStream[]): Map<string, ProgressItem> {
  const { authReady, isAuthed, me } = useAuth();
  const userId = isAuthed ? me?.id : null;
  const queryScope = progressCacheScope(userId);
  const localCacheAvailable = authReady && (!isAuthed || Boolean(userId));
  const videoUrls = useMemo(() => [...new Set(streams.map(videoProgressUrl))].sort(), [streams]);
  const query = useQuery({
    queryKey: ["progress-batch", queryScope, videoUrls],
    queryFn: async () => {
      const localMap = localCacheAvailable
        ? getBatchLocalProgress(videoUrls, userId)
        : new Map<string, ProgressItem>();
      if (!isAuthed) return Array.from(localMap.values());
      if (!userId || useAuthStore.getState().me?.id !== userId) {
        return Array.from(localMap.values());
      }
      try {
        const serverItems = await fetchProgressBatch(videoUrls);
        if (useAuthStore.getState().me?.id !== userId) {
          return Array.from(localMap.values());
        }
        const merged = new Map(localMap);
        for (const item of serverItems) {
          const loc = localMap.get(item.videoUrl);
          const { chosen, shouldSyncLocal } = reconcileProgressItem(loc, item);
          merged.set(item.videoUrl, chosen);
          if (shouldSyncLocal) {
            saveLocalProgress(item.videoUrl, chosen.position, chosen.updatedAt, userId);
          }
        }
        return Array.from(merged.values());
      } catch {
        return Array.from(localMap.values());
      }
    },
    enabled: authReady && (!isAuthed || Boolean(userId)) && videoUrls.length > 0,
    staleTime: 30_000,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
  });
  return useMemo(() => progressItemsByUrl(query.data ?? []), [query.data]);
}

export function useSaveProgress(videoUrl: string) {
  const { authReady, isAuthed, me } = useAuth();
  const userId = isAuthed ? me?.id : null;
  const queryScope = progressCacheScope(userId);
  const qc = useQueryClient();
  return useMutation({
    onMutate: async ({ position }) => {
      if (authReady && (!isAuthed || userId)) {
        saveLocalProgress(videoUrl, position, Date.now(), userId);
      }
      const next: ProgressItem = {
        videoUrl,
        position: Math.round(position),
        updatedAt: Date.now(),
      };
      qc.setQueryData(["progress", videoUrl, queryScope], next);
      qc.setQueriesData<ProgressItem[]>({ queryKey: ["progress-batch", queryScope] }, (items) =>
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
      const auth = useAuthStore.getState();
      if (!authReady || (auth.me?.id ?? null) !== userId) return Promise.resolve();
      const token = auth.token;
      return token ? updateProgress(videoUrl, position, keepalive) : Promise.resolve();
    },
    onSuccess: (_, { position }) => {
      const auth = useAuthStore.getState();
      if (!authReady || !isAuthed || !userId || auth.me?.id !== userId || !auth.token) return;
      const next: ProgressItem = {
        videoUrl,
        position: Math.round(position),
        updatedAt: Date.now(),
      };
      qc.setQueryData(["progress", videoUrl, queryScope], next);
    },
  });
}
