import { useLayoutEffect, useRef, useState } from "react";
import { fitGroupPage, type GroupPage, groupPage } from "../lib/group-pagination";

type Options = {
  total: number;
  rowRem: number;
  fallbackSize: number;
  reservedRem?: number;
  anchor?: number;
};

export function useGroupPagination({
  total,
  rowRem,
  fallbackSize,
  reservedRem = 0,
  anchor = -1,
}: Options): GroupPage & {
  viewport: React.RefObject<HTMLDivElement | null>;
  onPage: (page: number) => void;
} {
  const viewport = useRef<HTMLDivElement>(null);
  const [state, setState] = useState(() => groupPage(total, fallbackSize, 0));
  const current = groupPage(total, state.size, state.page);
  useLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const desktop = window.matchMedia("(min-width: 1024px) and (min-height: 600px)");
    function measure(): void {
      const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize);
      setState((previous) => {
        const next = fitGroupPage(
          previous,
          total,
          desktop.matches ? (element?.clientHeight ?? 0) : fallbackSize * rowRem * rem,
          rowRem * rem,
          desktop.matches ? reservedRem * rem : 0,
          anchor,
        );
        return next.size === previous.size &&
          next.page === previous.page &&
          next.end === previous.end &&
          next.pages === previous.pages
          ? previous
          : next;
      });
    }
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    desktop.addEventListener("change", measure);
    return () => {
      observer.disconnect();
      desktop.removeEventListener("change", measure);
    };
  }, [total, rowRem, fallbackSize, reservedRem, anchor]);
  return {
    ...current,
    viewport,
    onPage: (page) => setState(groupPage(total, current.size, page)),
  };
}
