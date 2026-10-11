import { useEffect, useRef } from "react";
import { useAlgorithmHighlightStore } from "../stores/algorithm-highlight-store";

const HIGHLIGHT_MS = 2600;

export function useHighlight<Element extends HTMLElement>(id: string | undefined) {
  const ref = useRef<Element>(null);
  const on = useAlgorithmHighlightStore((state) => id !== undefined && state.highlight === id);
  const setHighlight = useAlgorithmHighlightStore((state) => state.setHighlight);
  useEffect(() => {
    if (!on) return;
    const scroll = window.setTimeout(
      () => ref.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
      300,
    );
    const timer = window.setTimeout(() => setHighlight(null), HIGHLIGHT_MS);
    return () => {
      window.clearTimeout(scroll);
      window.clearTimeout(timer);
    };
  }, [on, setHighlight]);
  return { ref, className: on ? "algorithm-highlight" : "" };
}
