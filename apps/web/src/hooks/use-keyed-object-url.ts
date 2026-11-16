import { useEffect, useRef } from "react";

// Builds an object URL once per key and revokes it when the key changes or the component goes away.
export function useKeyedObjectUrl(key: string, build: () => string | null): string | null {
  const asset = useRef<{ key: string; url: string | null } | null>(null);
  if (asset.current?.key !== key) asset.current = { key, url: build() };
  const url = asset.current.url;
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );
  return url;
}
