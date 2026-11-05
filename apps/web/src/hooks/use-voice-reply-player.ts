import { useCallback, useEffect, useRef, useState } from "react";
import { fetchVoiceReplyAudio } from "../lib/api-comment-voice";

export type VoiceReplyPlayerState = "idle" | "loading" | "playing" | "paused" | "error";

export function useVoiceReplyPlayer(url: string) {
  const [state, setState] = useState<VoiceReplyPlayerState>("idle");
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
      if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    },
    [],
  );

  const toggle = useCallback(async () => {
    const current = audioRef.current;
    if (current) {
      if (current.paused) await current.play().catch(() => setState("error"));
      else current.pause();
      return;
    }
    setState("loading");
    try {
      const objectUrl = URL.createObjectURL(await fetchVoiceReplyAudio(url));
      objectUrlRef.current = objectUrl;
      const audio = new Audio(objectUrl);
      audio.addEventListener("play", () => setState("playing"));
      audio.addEventListener("pause", () => setState("paused"));
      audio.addEventListener("ended", () => {
        audio.currentTime = 0;
        setProgress(0);
      });
      audio.addEventListener("timeupdate", () => {
        setProgress(audio.duration > 0 ? audio.currentTime / audio.duration : 0);
      });
      audioRef.current = audio;
      await audio.play();
    } catch {
      setState("error");
    }
  }, [url]);

  return { state, progress, toggle };
}
