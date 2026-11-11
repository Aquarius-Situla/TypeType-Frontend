import { useEffect, useRef } from "react";
import { sponsorBlockBarPosition } from "../lib/sponsorblock-bar-layout";
import {
  getSponsorBlockCategoryColor,
  getSponsorBlockEndTime,
  getSponsorBlockStartTime,
} from "../lib/sponsorblock-settings";
import { useMediaState } from "../lib/vidstack";
import type { SponsorBlockSegmentItem } from "../types/api";

const TRACK_HEIGHT = 3;
const TIME_SLIDER_SELECTOR = ".vds-time-slider, .typetype-audio-time-slider";
const TRACK_SELECTOR =
  ".vds-slider-track:not(.vds-slider-track-fill):not(.vds-slider-progress), .typetype-audio-time-slider-track";

type SegmentBarProps = {
  segment: SponsorBlockSegmentItem;
  duration: number;
};

function SegmentBar({ segment, duration }: SegmentBarProps) {
  const color = getSponsorBlockCategoryColor(segment.category);
  if (!color) return null;
  const startTime = getSponsorBlockStartTime(segment, duration);
  const endTime = getSponsorBlockEndTime(segment, duration);
  const left = (startTime / duration) * 100;
  const width = ((endTime - startTime) / duration) * 100;
  return (
    <div
      className="typetype-sponsorblock-segment"
      style={{
        position: "absolute",
        left: `${left}%`,
        width: `${width}%`,
        top: 0,
        bottom: 0,
        backgroundColor: color,
        opacity: 0.8,
        pointerEvents: "none",
      }}
    />
  );
}

// The yellow of an ad break on the timeline.
const AD_BREAK_COLOR = "#ffcc00";

// `adBreak` marks the ad that plays before the video, at the very start of the timeline.
type Props = { segments: SponsorBlockSegmentItem[]; adBreak?: boolean };

export function SponsorBlockBar({ segments, adBreak = false }: Props) {
  const duration = useMediaState("duration");
  const controlsVisible = useMediaState("controlsVisible");
  const anchorRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const anchor = anchorRef.current;
    const overlay = overlayRef.current;
    if (!anchor || !overlay || !duration) return;
    if (!controlsVisible) return;

    const player = anchor.closest<HTMLElement>("[data-media-player]");
    if (!player) return;

    const visibleSlider = (sliders: HTMLElement[]) =>
      sliders.find((candidate) => {
        const rect = candidate.getBoundingClientRect();
        const style = getComputedStyle(candidate);
        return (
          rect.width > 0 &&
          rect.height > 0 &&
          style.display !== "none" &&
          style.visibility !== "hidden"
        );
      }) ?? sliders[0];

    const getSliders = () => [...player.querySelectorAll<HTMLElement>(TIME_SLIDER_SELECTOR)];

    let resizeObserver: ResizeObserver | undefined;

    const update = () => {
      const sliders = getSliders();
      for (const candidate of sliders) {
        resizeObserver?.observe(candidate);
        const track = candidate.querySelector<HTMLElement>(TRACK_SELECTOR);
        if (track) resizeObserver?.observe(track);
      }
      const slider = visibleSlider(sliders);
      if (!slider) return;
      const track = slider.querySelector<HTMLElement>(TRACK_SELECTOR);
      const pRect = player.getBoundingClientRect();
      const trackRect = (track ?? slider).getBoundingClientRect();
      const position = sponsorBlockBarPosition(pRect, trackRect, TRACK_HEIGHT);
      overlay.style.top = `${position.top}px`;
      overlay.style.left = `${position.left}px`;
      overlay.style.width = `${position.width}px`;
    };

    resizeObserver = new ResizeObserver(update);
    resizeObserver.observe(player);
    const mo = new MutationObserver(update);
    mo.observe(player, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ["aria-hidden", "data-match", "data-sm", "data-visible"],
    });
    update();
    return () => {
      resizeObserver?.disconnect();
      mo.disconnect();
    };
  }, [controlsVisible, duration]);

  if (!duration || (segments.length === 0 && !adBreak)) return null;

  return (
    <>
      <div ref={anchorRef} style={{ display: "none" }} />
      <div
        className="typetype-sponsorblock-bar"
        ref={overlayRef}
        style={{
          position: "absolute",
          height: `${TRACK_HEIGHT}px`,
          pointerEvents: "none",
          zIndex: 40,
          visibility: controlsVisible ? "visible" : "hidden",
        }}
      >
        {adBreak && (
          <div
            className="typetype-ad-break-mark"
            style={{
              position: "absolute",
              left: 0,
              width: "max(8px, 1%)",
              top: 0,
              bottom: 0,
              backgroundColor: AD_BREAK_COLOR,
              pointerEvents: "none",
            }}
          />
        )}
        {segments.map((seg) => (
          <SegmentBar key={`${seg.category}-${seg.startTime}`} segment={seg} duration={duration} />
        ))}
      </div>
    </>
  );
}
