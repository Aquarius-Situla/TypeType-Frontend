import { useEffect } from "react";
import {
  ensureCollectionMetadata,
  getSubscribedCollectionMeta,
  type SubscribedCollectionMeta,
} from "../lib/stream-collections";
import { useScopedValue } from "./use-scoped-value";

type CollectionMetadataVideo = {
  url?: string;
  id?: string;
  title?: string;
};

export function usePlaylistCollectionMeta(
  scopeId: string,
  enabled: boolean,
  playlistName: string,
  videos: CollectionMetadataVideo[],
): SubscribedCollectionMeta | undefined {
  const [meta, setMeta] = useScopedValue(scopeId, getSubscribedCollectionMeta(scopeId));

  useEffect(() => {
    if (!enabled || videos.length === 0) return;

    let cancelled = false;
    void ensureCollectionMetadata(scopeId, playlistName, videos).then((result) => {
      if (!cancelled) setMeta(result);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, playlistName, scopeId, setMeta, videos]);

  return meta;
}
