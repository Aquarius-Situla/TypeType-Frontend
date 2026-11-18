import { selectQuality, useMedia, usePlayer } from "@videojs/react";
import { useEffect, useRef } from "react";
import { SabrVideoAdapter } from "../lib/sabr-video-adapter";
import { pickRendition } from "../lib/video-js-quality";

export function VideoJsQualityDefault({ quality }: { quality?: string }) {
  const slice = usePlayer(selectQuality);
  const selfManaged = useMedia() instanceof SabrVideoAdapter;
  const applied = useRef(false);
  const renditions = slice?.videoRenditionList;
  const select = slice?.selectVideoRendition;

  useEffect(() => {
    if (selfManaged || applied.current || !renditions?.length || !select) return;
    applied.current = true;
    const target = pickRendition(renditions, quality);
    if (target) select(target.id);
  }, [selfManaged, renditions, select, quality]);

  return null;
}
