import { useEffect, useState } from "react";
import { m } from "../paraglide/messages.js";

export function useWatchToast(audioOnlyUnavailable: boolean, sponsorBlockUnavailable: boolean) {
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    if (!audioOnlyUnavailable) return;
    setToast(m.ui_audio_only_unavailable());
  }, [audioOnlyUnavailable]);

  useEffect(() => {
    if (!sponsorBlockUnavailable) return;
    setToast(m.watch_sponsorblock_unavailable());
  }, [sponsorBlockUnavailable]);

  return { toast, setToast };
}
