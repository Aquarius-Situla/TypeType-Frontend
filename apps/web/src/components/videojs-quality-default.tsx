import { selectQuality, usePlayer } from "@videojs/react";
import { useEffect, useRef } from "react";
import { pickRendition } from "../lib/video-js-quality";

export function VideoJsQualityDefault({ quality }: { quality?: string }) {
  const slice = usePlayer(selectQuality);
  const applied = useRef(false);
  const renditions = slice?.videoRenditionList;
  const select = slice?.selectVideoRendition;

  useEffect(() => {
    if (applied.current || !renditions?.length || !select) return;
    applied.current = true;
    const target = pickRendition(renditions, quality);
    if (target) select(target.id);
  }, [renditions, select, quality]);

  return null;
}
