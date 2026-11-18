import { useEffect, useState } from "react";
import { toWebVtt } from "../lib/web-vtt";

export function useWebVttUrl(url: string | undefined): string | undefined {
  const [vttUrl, setVttUrl] = useState<string | undefined>(undefined);
  useEffect(() => {
    setVttUrl(undefined);
    if (!url) return;
    const controller = new AbortController();
    let created: string | null = null;
    fetch(url, { signal: controller.signal })
      .then((response) => (response.ok ? response.text() : Promise.reject(new Error("vtt"))))
      .then((text) => {
        const vtt = toWebVtt(text);
        if (!vtt || controller.signal.aborted) return;
        created = URL.createObjectURL(new Blob([vtt], { type: "text/vtt" }));
        setVttUrl(created);
      })
      .catch(() => undefined);
    return () => {
      controller.abort();
      if (created) URL.revokeObjectURL(created);
    };
  }, [url]);
  return vttUrl;
}
