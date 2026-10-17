import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { addFavorite, fetchFavorites, removeFavorite } from "../lib/api-collections";
import type { FavoriteItem } from "../types/user";
import { useAuth } from "./use-auth";

const FAVORITES_KEY = ["favorites"] as const;

export function useFavoriteStatus(videoUrl: string) {
  const { authReady, isAuthed } = useAuth();
  const queryClient = useQueryClient();
  const [intent, setIntent] = useState<boolean | null>(null);
  const query = useQuery({
    queryKey: FAVORITES_KEY,
    queryFn: fetchFavorites,
    enabled: authReady && isAuthed,
  });
  const isInFavorites = query.data?.some((item) => item.videoUrl === videoUrl) ?? false;
  const isFavorite = intent ?? isInFavorites;

  async function add(): Promise<void> {
    if (isFavorite) return;
    setIntent(true);
    try {
      const favorite = await addFavorite(videoUrl);
      queryClient.setQueryData<FavoriteItem[]>(FAVORITES_KEY, (prev) =>
        prev ? [favorite, ...prev.filter((item) => item.videoUrl !== videoUrl)] : [favorite],
      );
      await queryClient.invalidateQueries({
        queryKey: FAVORITES_KEY,
        exact: true,
        refetchType: "none",
      });
    } catch (error) {
      setIntent(null);
      throw error;
    }
    setIntent(null);
  }

  async function remove(): Promise<void> {
    setIntent(false);
    try {
      await removeFavorite(videoUrl);
      queryClient.setQueryData<FavoriteItem[]>(FAVORITES_KEY, (prev) =>
        prev ? prev.filter((item) => item.videoUrl !== videoUrl) : [],
      );
      await queryClient.invalidateQueries({
        queryKey: FAVORITES_KEY,
        exact: true,
        refetchType: "none",
      });
    } catch (error) {
      setIntent(null);
      throw error;
    }
    setIntent(null);
  }

  return {
    isFavorite,
    add,
    remove,
    isPending: (authReady && isAuthed && query.isPending) || intent !== null,
  };
}

