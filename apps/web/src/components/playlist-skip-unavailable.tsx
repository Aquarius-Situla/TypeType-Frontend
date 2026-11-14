import { useEffect } from "react";
import { useWatchPlaylist } from "../hooks/use-watch-playlist";

const SKIP_DELAY_MS = 4000;

type Props = {
  list: string;
  shuffle?: string;
  currentParam: string;
  onScheduled: (scheduled: boolean) => void;
};

export function PlaylistSkipUnavailable({ list, shuffle, currentParam, onScheduled }: Props) {
  const { playNext } = useWatchPlaylist(list, shuffle, currentParam);

  useEffect(() => {
    onScheduled(Boolean(playNext));
    if (!playNext) return;
    const timer = window.setTimeout(playNext, SKIP_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [playNext, onScheduled]);

  return null;
}
