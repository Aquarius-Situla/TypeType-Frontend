import { Link } from "@tanstack/react-router";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useCompactPlayer } from "../hooks/use-compact-player";
import { endScreenBox, visibleEndScreenElements } from "../lib/end-screen";
import { watchRouteSearch } from "../lib/watch-url";
import type { EndScreenItem } from "../types/api";
import { ChannelRouteLink } from "./channel-route-link";

const FRAME_ASPECT_RATIO = 16 / 9;
const CHECK_INTERVAL_MS = 250;
const CARD =
  "group/end absolute block overflow-hidden bg-black/40 shadow-lg ring-1 ring-white/25 transition hover:ring-2 hover:ring-white";

function ElementLink({
  element,
  className,
  style,
  children,
}: {
  element: EndScreenItem;
  className: string;
  style: React.CSSProperties;
  children: ReactNode;
}) {
  if (element.type === "website") {
    return (
      <a
        href={element.url}
        target="_blank"
        rel="noopener noreferrer"
        title={element.title}
        className={className}
        style={style}
      >
        {children}
      </a>
    );
  }
  if (element.type === "channel") {
    return (
      <span title={element.title} className={className} style={style}>
        <ChannelRouteLink url={element.url} className="block h-full w-full">
          {children}
        </ChannelRouteLink>
      </span>
    );
  }
  return (
    <Link
      to="/watch"
      search={watchRouteSearch(element.url)}
      title={element.title}
      className={className}
      style={style}
    >
      {children}
    </Link>
  );
}

export function EndScreenOverlay({ elements }: { elements: EndScreenItem[] }) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const compact = useCompactPlayer();
  const [visible, setVisible] = useState<EndScreenItem[]>([]);

  useEffect(() => {
    let key = "";
    // The player can mount or replace its video element after this overlay, so it is looked up
    // on every check instead of once.
    const update = () => {
      const video = rootRef.current?.closest("[data-media-player]")?.querySelector("video");
      const next = video ? visibleEndScreenElements(elements, video.currentTime * 1000) : [];
      const nextKey = next.map((element) => element.id).join(",");
      if (nextKey === key) return;
      key = nextKey;
      setVisible(next);
    };
    update();
    const timer = window.setInterval(update, CHECK_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [elements]);

  return (
    <div ref={rootRef} className="pointer-events-none absolute inset-0 z-10">
      {!compact &&
        visible.map((element) => {
          const box = endScreenBox(element, FRAME_ASPECT_RATIO);
          const round = element.type === "channel" || element.type === "website";
          return (
            <ElementLink
              key={element.id}
              element={element}
              className={`${CARD} pointer-events-auto ${round ? "rounded-full" : "rounded-lg"}`}
              style={{
                left: `${box.left}%`,
                top: `${box.top}%`,
                width: `${box.width}%`,
                height: `${box.height}%`,
              }}
            >
              {element.thumbnailUrl && (
                <img
                  src={element.thumbnailUrl}
                  alt=""
                  className="h-full w-full object-cover"
                  draggable={false}
                />
              )}
              {!round && (
                <span className="absolute inset-x-0 bottom-0 line-clamp-2 bg-gradient-to-t from-black/85 to-transparent px-2 pb-1 pt-4 text-left text-xs font-medium text-white opacity-0 transition-opacity group-hover/end:opacity-100">
                  {element.title}
                </span>
              )}
            </ElementLink>
          );
        })}
    </div>
  );
}
